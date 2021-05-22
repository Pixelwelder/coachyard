const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { newStripeCustomer, newStripePayment, newCourseToken } = require('../data');
const { checkAuth } = require('../util/auth');
const { log } = require ('../logging');
const express = require('express');
const bodyParser = require('body-parser');
const { setClaims } = require('../util/claims');
const stripe = require('./stripe');
const { webhook_secret } = require('../config').stripe;
const { unlockCourse } = require('../courses/unlockCourse');

/**
 * When a new user is created, create a matching Stripe Customer.
 */
// const stripe_onCreateUser = functions.auth.user()
//   .onCreate(async (_user) => {
//     const user = await admin.auth().getUser(_user.uid);
//     log({ message: 'Billing: a user was created.', data: user });
//     // const timestamp = admin.firestore.Timestamp.now();
//     // const stripeCustomer = await stripe.customers.create({
//     //   name: user.displayName,
//     //   email: user.email,
//     //   metadata: { uid: user.uid }
//     // });
//     // // TODO Do we actually want to do this?
//     // const stripeIntent = await stripe.setupIntents.create({ customer: stripeCustomer.id });
//
//     await admin.firestore().runTransaction(async (transaction) => {
//       try {
//         // Create our own object in our own database.
//         const fbCustomer = newStripeCustomer({
//           uid: user.uid,
//           created: timestamp,
//           updated: timestamp,
//           customer_id: stripeCustomer.id,
//           setup_secret: stripeIntent.client_secret
//         });
//
//         const ref = admin.firestore().collection('stripe_customers').doc(user.uid);
//         await transaction.set(ref, fbCustomer);
//       } catch (error) {
//         console.log('----------');
//         console.error(error);
//         console.log('----------');
//       }
//     })
//   });

/**
 * Any time a user is deleted, we delete all record of (1) their Stripe Customer, and (2) their payment methods.
 * TODO This is totally untested.
 * TODO Also remove all sessions.
 */
const stripe_onDeleteUser = functions.auth.user()
  .onDelete(async (user) => {
    log({ message: 'Billing: a user was deleted.', data: user });
    const { uid } = user;
    const customerRef = admin.firestore().collection('stripe_customers').doc(uid);
    const customerDoc = await customerRef.get();
    const customer = customerDoc.data();
    const paymentMethodsSnapshot = await customerRef.collection('payment_methods').get();
    const subscriptionsSnapshot = await customerRef.collection('subscriptions').get();

    // Delete all payment methods.
    paymentMethodsSnapshot.forEach(doc => doc.ref.delete());

    // Cancel the subscription.
    const subscriptionsRef = customerRef.collection('subscriptions');
    const subscriptionDocs = await subscriptionsRef.get();
    // if (subscriptionDocs.size !== 1) throw new Error(`Expected 1 subscription, got ${subscriptionDocs.size}.`);
    // const subscriptionDoc = subscriptionDocs.docs[0];
    // const cachedSubscription = subscriptionDoc.data();

    // const subscription = await stripe.subscriptions.retrieve(cachedSubscription.id);

    // Delete all subscriptions.
    const promises = subscriptionsSnapshot.docs.map(async (doc) => {
      const cachedSubscription = doc.data();
      await stripe.subscriptions.del(cachedSubscription.id);
      doc.ref.delete();
    });

    await Promise.all(promises);

    // Delete customer.
    await customerRef.delete();
  });


/**
 * The payment method doc is added on the client. This function hears it and creates the Stripe counterpart.
 */
// TODO Improve this.
const pricesByTier = {
  1: 'price_1IFTGFISeRywORka8Caa1NgV',
  2: 'price_1IFTGFISeRywORkaIHqLYNnv',
  3: 'price_1IFTGFISeRywORkaGhbHipz0'
};
const tiersByPrice = Object.entries(pricesByTier).reduce((accum, [name, val]) => ({
  ...accum,
  [val]: name
}), {});
const createPaymentMethod = functions.https.onCall(async (data, context) => {
  try {
    log({ message: 'Billing: creating a payment method...', data, context });
    checkAuth(context);

    const { auth: { uid } } = context;
    const { id: paymentMethodId } = data;

    // Define refs we'll need.
    const customerRef = admin.firestore().collection('stripe_customers').doc(uid)
    const paymentMethodCollectionRef = customerRef.collection('payment_methods');
    const paymentMethodRef = paymentMethodCollectionRef.doc(paymentMethodId);
    const paymentMethodCollectionDocs = await paymentMethodCollectionRef.get();

    // Make sure we don't already have a payment method.
    // TODO This is arbitrary and should be improved someday. Perhaps replace?
    if (paymentMethodCollectionDocs.size) throw new Error('Only one payment method allowed.');

    // Now we attach the payment method to the customer.
    const customerDoc = await customerRef.get();
    const customer = customerDoc.data();
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.customer_id });

    // Then set default invoice settings to point to the payment method.
    await stripe.customers.update(
      customer.customer_id,
      {
        invoice_settings: { default_payment_method: paymentMethodId }
      }
    );

    // Now we save record of the payment method to Firebase.
    await paymentMethodRef.set(paymentMethod);

    log({
      message: 'Billing: payment method created and added successfully.',
      data: { uid, paymentMethodId }
    });
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

// const unlockCourse = functions.https.onCall(async (data, context) => {
//   try {
//     log({ message: 'Unlocking course...', data, context });
//     checkAuth(context);
//     const { uid: courseUid } = data;
//     const { auth: { uid } } = context;
//
//     const result = await admin.firestore().runTransaction(async (transaction) => {
//       const studentRef = admin.firestore().collection('users').doc(uid);
//       const studentDoc = await transaction.get(studentRef);
//
//       const courseRef = admin.firestore().collection('courses').doc(courseUid);
//       const courseDoc = await transaction.get(courseRef);
//
//       const tokensRef = admin.firestore().collection('tokens')
//         .where('courseUid', '==', courseUid)
//         .where('user', '==', uid);
//       const tokensDocs = await transaction.get(tokensRef);
//       if (tokensDocs.size) throw new Error('User already has access this course.');
//
//       const student = studentDoc.data();
//       const course = courseDoc.data();
//       const timestamp = admin.firestore.Timestamp.now();
//
//       // Now create access token.
//       const token = newCourseToken({
//         user: uid,
//         userDisplayName: student.displayName,
//         courseUid,
//
//         created: timestamp,
//         updated: timestamp,
//
//         // Abbreviated Course
//         displayName: course.displayName,
//         description: course.description,
//         image: course.image,
//         parent: course.uid,
//         creatorUid: course.creatorUid,
//         type: 'basic', // 'basic', 'template'
//       });
//       const tokenRef = admin.firestore().collection('tokens').doc();
//       await transaction.set(tokenRef, token);
//     });
//
//     log({ message: 'Course unlocked.', data, context });
//   } catch (error) {
//     log({ message: error.message, data: error, context, level: 'error' });
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
// });

/**
 * Sets billing tier for the user.
 * @param id - id of the new billing tier.
 */
const createSubscription = functions.https.onCall(async (data, context) => {
  try {
    log({ message: `Billing: creating a subscription.`, data, context });
    checkAuth(context);
    const { tier } = data;
    const { auth: { uid } } = context;

    // This assumes we have a payment method.
    const customerDoc = await admin.firestore().collection('stripe_customers').doc(uid).get();
    if (!customerDoc.exists) throw new Error(`Customer ${uid} doesn't exist.`);
    const customer = customerDoc.data();
    console.log('got customer');
    const price = pricesByTier[tier];
    console.log('price', price);
    const subscription = await stripe.subscriptions.create({
      customer: customer.customer_id,
      items: [{ price }],
      expand: ['latest_invoice.payment_intent']
    });
    console.log('got subscription', subscription);

    // Save the subscription to Firestore.
    await admin.firestore().runTransaction(async transaction => {
      const ref = admin.firestore()
        .collection('stripe_customers')
        .doc(uid)
        .collection('subscriptions')
        .doc(subscription.id);

      await transaction.set(ref, subscription);
    })
    // await admin.firestore()
    //   .collection('stripe_customers')
    //   .doc(uid)
    //   .collection('subscriptions')
    //   .doc(subscription.id)
    //   .set({ test: 'hello' });

    const tierDef = tiers[tier - 1];
    console.log('set subscription', uid, tier, tierDef);
    await setClaims({ uid, claims: { tier, subscribed: true, remaining: tierDef.unitsAmount * 60 } });
    console.log('set claims');

    log({ message: `Billing: created a subscription for ${uid}...`, data: { id: subscription.id }, context });
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

const updateSubscription = functions.https.onCall(async (data, context) => {
  try {
    log({ message: `Billing: updating a subscription.`, data, context });
    checkAuth(context);

    const { id: tier, params } = data;
    const { auth: { uid } } = context;

    const customerRef = admin.firestore().collection('stripe_customers').doc(uid);
    const subscriptionsRef = customerRef.collection('subscriptions');
    const subscriptionDocs = await subscriptionsRef.get();
    if (subscriptionDocs.size !== 1) throw new Error(`Expected 1 subscription, got ${subscriptionDocs.size}.`);
    const subscriptionDoc = subscriptionDocs.docs[0];
    const cachedSubscription = subscriptionDoc.data();

    const subscription = await stripe.subscriptions.retrieve(cachedSubscription.id);
    const currentPrice = subscription.plan ? subscription.plan.id : null;
    const currentTier = tiersByPrice[currentPrice];
    if (tier === currentTier) throw new Error(`Customer is already at tier ${tier}.`);

    const item = subscription.items.data[0];
    const newPrice = pricesByTier[tier];
    const update = await stripe.subscriptionItems.update(
      item.id,
      {
        price: newPrice,
        proration_behavior: 'always_invoice'
      }
    );

    // TODO Might not have to do this every single time.
    const newSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: false
      }
    );
    console.log(newSubscription);
    await subscriptionDoc.ref.update(newSubscription);
    // const newSubscription = await stripe.subscriptions.update(
    //   subscription.id,
    //   {
    //     cancel_at_period_end: false,
    //     items: [{ price: newPrice }]
    //   }
    // );

    // await subscriptionDoc.ref.set(newSubscription);

    // TODO Move this to the webhook.
    // TODO How do we handle rolling hours between changed subscriptions?
    const tierDef = tiers[tier - 1];
    await setClaims({ uid, claims: { tier, subscribed: true, remaining: tierDef.unitsAmount * 60 } });

    log({ message: `Billing: updated a subscription.`, data, context });
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

const cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    console.log('updateSubscription');
    checkAuth(context);

    const { id: tier } = data;
    const { auth: { uid } } = context;

    const customerRef = admin.firestore().collection('stripe_customers').doc(uid);
    const subscriptionsRef = customerRef.collection('subscriptions');
    const subscriptionDocs = await subscriptionsRef.get();
    if (subscriptionDocs.size !== 1) throw new Error(`Expected 1 subscription, got ${subscriptionDocs.size}.`);
    const subscriptionDoc = subscriptionDocs.docs[0];
    const subscription = subscriptionDoc.data();

    const newSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: true
      }
    );

    await subscriptionDoc.ref.set(newSubscription);

    // Update doc so we see a change on the client.
    setClaims({ uid, claims: { subscribed: false }})
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

const checkSubscription = functions.https.onCall(async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const subDocs = await admin.firestore()
      .collection('stripe_customers').doc(uid)
      .collection('subscriptions').limit(1)
      .get();

    if (!subDocs.size) return -1;

    const id = subDocs.docs[0].id;
    const subscription = await stripe.subscriptions.retrieve(id);
    const {
      current_period_end = -1,
      cancel_at_period_end = false,
      plan: { id: price } = {}
    } = subscription;
    const tier = tiersByPrice[price] || '-1';

    return { tier, current_period_end, cancel_at_period_end };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

/**
 * Reconfirm payment after authentication for 3D Secure.
 */
const stripe_onConfirmPayment = functions.firestore
  .document('/stripe_customers/{userId}/payments/{pushId}')
  .onUpdate(async (change, context) => {
    log({ message: 'Billing: a payment was confirmed.', data: change.after.data(), context });
    if (change.after.data().status === 'requires_confirmation') {
      const payment = await stripe.paymentIntents.confirm(change.after.data().id);
      await change.after.ref.set(payment);
    }
  });

// const stripe_cancelSubscription = functions.https.onCall(async (data, context) => {
//   log({ message: 'Billing: attempting to cancel subscription.', data: data, context });
//   checkAuth(context);
//
//   try {
//     const { id } = data;
//     const subscription = await stripe.subscriptions.del(id);
//
//     log({ message: 'Billing: subscription canceled.', data: { id: subscription.id }, context });
//     return { message: 'Subscription canceled.', subscription };
//   } catch (error) {
//     log({ message: error.message, data: error, context, level: 'error' });
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
// });

const tiers = [
  // { id: 0, displayName: 'Student', price: 0, period: 'forever', unitsName: 'hours', unitsAmount: 'unlimited' },
  { id: 1, displayName: 'Coach', price: 24.95, period: 'per month', unitsName: 'hours', unitsAmount: 15 },
  { id: 2, displayName: 'Mentor', price: 39.95, period: 'per month', unitsName: 'hours', unitsAmount: 30 },
  { id: 3, displayName: 'Guru', price: 99.95, period: 'per month', unitsName: 'hours', unitsAmount: 100 }
];

// TODO This should be related to the actual prices defined in Stripe.
const getTiers = functions.https.onCall((data, context) => {
  return tiers;
});

const deleteSessions = async ({ studentUid, courseUid }) => {
  await admin.firestore().runTransaction(async (transaction) => {
    const docs = await admin.firestore()
      .collection('stripe_customers').doc(studentUid)
      .collection('sessions').doc(courseUid)
      .collection('sessions')
      .get();

    if (docs.size) {
      console.log('Deleting all sessions');
      await Promise.all(docs.docs.map((doc) => {
        return transaction.delete(doc.ref);
      }));
    }
  });
};

const stripe_webhooks = express();
// stripe_webhooks.use(bodyParser.urlencoded({ extended: false }));
// stripe_webhooks.use(bodyParser.json());
stripe_webhooks.post(
  '/webhooks',
  // bodyParser.raw({type: 'application/json'}),
  async (request, response) => {
    console.log('STRIPE WEBHOOK');
    try {
      const { body, rawBody, headers } = request;
      const signature = headers['stripe-signature'];

      const event = process.env.FUNCTIONS_EMULATOR
        ? body
        : stripe.webhooks.constructEvent(rawBody, signature, webhook_secret);

      const {
        type, data: { object }
      } = event;
      const { id, customer, metadata } = object;
      log({ message: 'Billing: Received Stripe webhook.', data: { type, id } });

      // IDEMPOTENCY
      const exists = await admin.firestore().runTransaction(async (transaction) => {
        // Test webhook.
        if (id === 'cs_00000000000000') return false;

        const eventRef = admin.firestore().collection('stripe_events').doc(id);
        const event = await transaction.get(eventRef);
        if (event.exists) return true;

        await transaction.create(eventRef, body);
        return false;
      });

      if (exists) return response.status(200).send('Already handled.').end();

      // Handle the event.
      console.log('handling webhook event');
      switch (type) {
        case 'customer.subscription.updated': {

        }

        case 'customer.subscription.deleted': {
          const snapshot = await admin.firestore()
            .collection('stripe_customers')
            .where('customer_id', '==', customer)
            .get();

          if (!snapshot.size) throw new Error(`No customer by id ${customer}.`);

          const snapshot2 = await snapshot.docs[0].ref
            .collection('subscriptions')
            .doc(id);

          await snapshot2.delete();
          console.log('Deleted');

          if (!snapshot.size) {
            console.error('No customer by id', customer);
          }
        }

        case 'checkout.session.completed': {
          console.log('COMPLETED');
          console.log(object);
          const { studentUid, courseUid } = metadata;
          console.log('Checkout completed!', studentUid, courseUid );
          if (!studentUid || !courseUid) throw new Error(`Received ${studentUid}/${courseUid} for studentUid/courseUid.`);

          // TODO It's possible to get more than one here, in the user has started more than one.
          // When we get a success, we delete all pending sessions. TODO Revisit.
          // await admin.firestore()
          //   .collection('stripe_customers').doc(studentUid)
          //   .collection('sessions').doc(courseUid)
          //   .collection('sessions').doc(id)
          //   .update({ session: object });

          await deleteSessions({ courseUid, studentUid });

          // This is where we do the actual cloning of courses and such.
          await unlockCourse(object);
          console.log('webhook complete');
        }

        case 'checkout.session.async_payment_failed': {
          // Delete the specific session that failed.
          const { studentUid, courseUid } = metadata;
          console.log('FAILED')
          await admin.firestore()
            .collection('stripe_customers').doc(studentUid)
            .collection('sessions').doc(courseUid)
            .collection('sessions').doc(object.id)
            .delete();

          /*
          await admin.firestore().runTransaction(async (transaction) => {
    const docs = await admin.firestore()
      .collection('stripe_customers').doc(studentUid)
      .collection('sessions').doc(courseUid)
      .collection('sessions')
      .get();

    if (docs.size) {
      console.log('Deleting all sessions');
      await Promise.all(docs.docs.map((doc) => {
        return transaction.delete(doc.ref);
      }));
    }
  });
           */
        }

        default: {
          // Unhandled.
        }
      }
      return response.status(200).end();
    } catch (error) {
      log({ message: error.message, data: error, level: 'error' });
      return response.status(400).send(`Webhook error: ${error.message}`);
    }
  }
);

module.exports = {
  getTiers,
  createPaymentMethod,
  // unlockCourse,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  checkSubscription,

  // stripe_onCreateUser,
  // stripe_onCreatePaymentMethod,
  // stripe_onCreatePayment,
  stripe_onConfirmPayment,
  stripe_onDeleteUser,

  // stripe_cancelSubscription,
  stripe: functions.https.onRequest(stripe_webhooks)
};
