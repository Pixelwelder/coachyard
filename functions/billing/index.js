const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Stripe } = require('stripe');
const { newStripeCustomer, newStripePayment } = require('../data');
const { checkAuth } = require('../util/auth');
const { log } = require ('../logging');
const express = require('express');
const bodyParser = require('body-parser');
const { secret_key } = require('../__config__/stripe.json');

const stripe = new Stripe(
  secret_key,
  { apiVersion: '2020-08-27' }
);

/**
 * When a new user is created, create a matching Stripe Customer.
 */
const stripe_onCreateUser = functions.auth.user()
  .onCreate(async (user) => {
    log({ message: 'Billing: a user was created.', data: user });
    const timestamp = admin.firestore.Timestamp.now();
    const stripeCustomer = await stripe.customers.create({
      name: user.displayName,
      email: user.email,
      metadata: { uid: user.uid }
    });
    // TODO Do we actually want to do this?
    const stripeIntent = await stripe.setupIntents.create({ customer: stripeCustomer.id });

    // Create our own object in our own database.
    const fbCustomer = newStripeCustomer({
      uid: user.uid,
      created: timestamp,
      updated: timestamp,
      customer_id: stripeCustomer.id,
      setup_secret: stripeIntent.client_secret
    });
    await admin.firestore().collection('stripe_customers').doc(user.uid).set(fbCustomer);
  });

/**
 * Any time a user is deleted, we delete all record of (1) their Stripe Customer, and (2) their payment methods.
 */
const stripe_onDeleteUser = functions.auth.user()
  .onDelete(async (user) => {
    log({ message: 'Billing: a user was deleted.', data: user });
    const dbRef = admin.firestore().collection('stripe_customers');
    const customer = (await dbRef.doc(user.uid).get()).data();
    const snapshot = await dbRef.doc(user.uid).collection('payment_methods').get();
    snapshot.forEach(doc => doc.ref.delete());
    await dbRef.doc(user.uid).delete();
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

/**
 * Sets billing tier for the user.
 * @param id - id of the new billing tier.
 */
const createSubscription = functions.https.onCall(async (data, context) => {
  try {
    log({ message: `Billing: creating a subscription.`, data, context });
    checkAuth(context);
    const { id: tier } = data;
    const { auth: { uid } } = context;

    // This assumes we have a payment method.
    const customerDoc = await admin.firestore().collection('stripe_customers').doc(uid).get();
    if (!customerDoc.exists) throw new Error(`Customer ${uid} doesn't exist.`);
    const customer = customerDoc.data();
    const price = pricesByTier[tier];
    const subscription = await stripe.subscriptions.create({
      customer: customer.customer_id,
      items: [{ price }],
      expand: ['latest_invoice.payment_intent'] // TODO No idea what this does.
    });

    // Save the subscription to Firestore.
    await admin.firestore()
      .collection('stripe_customers')
      .doc(uid)
      .collection('subscriptions')
      .doc(subscription.id)
      .set(subscription);

    // Set user claims.
    // TODO Move this to the webhook.
    const user = await admin.auth().getUser(uid);
    await admin.auth().setCustomUserClaims(uid, { ...user.customClaims, tier });
    await admin.firestore().collection('users').doc(uid).update({ tier }); // For notification.

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

    const { id: tier } = data;
    const { auth: { uid } } = context;

    const customerRef = admin.firestore().collection('stripe_customers').doc(uid);
    const subscriptionsRef = customerRef.collection('subscriptions');
    const subscriptionDocs = await subscriptionsRef.get();
    if (subscriptionDocs.size !== 1) throw new Error(`Expected 1 subscription, got ${subscriptionDocs.size}.`);
    const subscriptionDoc = subscriptionDocs.docs[0];
    const cachedSubscription = subscriptionDoc.data();

    const subscription = await stripe.subscriptions.retrieve(cachedSubscription.id);
    const currentPrice = subscription.plan.id;
    const currentTier = tiersByPrice[currentPrice];
    if (tier === currentTier) throw new Error(`Customer is already at tier ${tier}.`);

    const newPrice = pricesByTier[tier];
    const newSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        items: [{ price: newPrice }]
      }
    );

    await subscriptionDoc.ref.set(newSubscription);

    // TODO Move this to the webhook.
    const user = await admin.auth().getUser(uid);
    await admin.auth().setCustomUserClaims(uid, { ...user.customClaims, tier });
    await admin.firestore().collection('users').doc(uid).update({ tier }); // For notification.

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

// TODO This should be related to the actual prices defined in Stripe.
const getTiers = functions.https.onCall((data, context) => {
  return [
    // { id: 0, displayName: 'Student', price: 0, period: 'forever', unitsName: 'hours', unitsAmount: 'unlimited' },
    { id: 1, displayName: 'Coach', price: 24.95, period: 'per month', unitsName: 'hours', unitsAmount: 15 },
    { id: 2, displayName: 'Mentor', price: 39.95, period: 'per month', unitsName: 'hours', unitsAmount: 30 },
    { id: 3, displayName: 'Guru', price: 99.95, period: 'per month', unitsName: 'hours', unitsAmount: 100 }
  ];
});

const stripe_webhooks = express();
stripe_webhooks.use(bodyParser.urlencoded({ extended: false }));
stripe_webhooks.use(bodyParser.json());
stripe_webhooks.post(
  '/webhooks',
  async (request, response) => {
    try {
      const { body } = request;
      const {
        type,
        data: {
          object: {
            id,
            customer
          }
        }
      } = body;
      log({ message: 'Billing: Received Stripe webhook.', data: type });

      // IDEMPOTENCY
      const exists = admin.firestore().runTransaction(async (transaction) => {
        const eventRef = admin.firestore().collection('stripe_events').doc(id);
        const event = await transaction.get(eventRef);
        if (event.exists) return true;

        await transaction.create(eventRef, body);
        return false;
      });

      if (exists) return response.status(200).end();

      // Handle the event.
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

        default: {
          // Unhandled.
        }
      }
      return response.status(200).end();
    } catch (error) {
      log({ message: error.message, data: error, level: 'error' });
      return response.status(500).end();
    }
  }
);

module.exports = {
  getTiers,
  createPaymentMethod,
  createSubscription,
  updateSubscription,
  cancelSubscription,

  stripe_onCreateUser,
  // stripe_onCreatePaymentMethod,
  // stripe_onCreatePayment,
  stripe_onConfirmPayment,
  stripe_onDeleteUser,

  // stripe_cancelSubscription,
  stripe: functions.https.onRequest(stripe_webhooks)
};
