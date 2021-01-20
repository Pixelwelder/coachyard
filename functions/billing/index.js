const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Stripe } = require('stripe');
const { newStripeCustomer, newStripePayment } = require('../data');
const { checkAuth } = require('../util/auth');
const { log } = require ('../logging');
const express = require('express');
const bodyParser = require('body-parser');

const stripe = new Stripe(
  functions.config().stripe.secret_key,
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
const basicPrice = 'price_1I2h4fISeRywORkaFpUun2Xw';
const stripe_onCreatePaymentMethod = functions.firestore
  .document('/stripe_customers/{userId}/payment_methods/{pushId}')
  .onCreate(async (snapshot, context) => {
    try {
      const { userId } = context.params;
      log({ message: `Billing: creating a subscription for ${userId}...`, data: snapshot.data(), context });

      // Grab and save the payment method.
      const { id: paymentMethodId } = snapshot.data();
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      await snapshot.ref.set(paymentMethod);

      const customerRef = snapshot.ref.parent.parent;
      const customerDoc = await customerRef.get();
      const customer = customerDoc.data();

      // Attach the payment method to the customer.
      const attachResult = await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.customer_id });

      // Change default invoice settings to point to the payment method.
      const changeResult = await stripe.customers.update(
        customer.customer_id,
        {
          invoice_settings: { default_payment_method: paymentMethodId }
        }
      );

      // Now create the subscription.
      const subscription = await stripe.subscriptions.create({
        customer: customer.customer_id,
        items: [{ price: basicPrice }],
        expand: ['latest_invoice.payment_intent'] // TODO No idea what this does.
      });

      await admin.firestore()
        .collection('stripe_customers')
        .doc(userId)
        .collection('subscriptions')
        .doc(subscription.id)
        .set(subscription);

      // console.log('setting token...');
      // TODO Doesn't work with emulators.
      // const user = await admin.auth().getUser(userId);
      // await admin.auth().setCustomUserClaims(userId, {
      //   ...user.customClaims,
      //   subscription: 1
      // });
      await admin.firestore().collection('users').doc(userId).update({ subscription: 1 });

      // Now create a setup intent.
      // const intent = await stripe.setupIntents.create({ customer: customer.customer_id });
      // await snapshot.ref.parent.parent.set(
      //   { setup_secret: intent.client_secret },
      //   { merge: true }
      // );
      log({ message: `Billing: created a subscription for ${userId}...`, data: { id: subscription.id }, context });
    } catch (error) {
      log({ message: error.message, data: error, context, level: 'error' });
      await snapshot.ref.set(
        { error: error.message },
        { merge: true }
      );
    }
  });

/**
 * The payment doc is added on the client. This function hears it and creates the payment itself.
 */
const stripe_onCreatePayment = functions.firestore
  .document('/stripe_customers/{userId}/payments/{pushId}')
  .onCreate(async (snapshot, context) => {
    log({ message: 'Billing: a payment was created.', data: snapshot.data(), context });
    const { amount, currency, payment_method } = snapshot.data();
    try {
      const { customer_id: customer } = (await snapshot.ref.parent.parent.get()).data();
      const { pushId: idempotencyKey } = context.params;
      const payment = await stripe.paymentIntents.create(
        newStripePayment({
          amount,
          currency,
          customer,
          payment_method
        }),
        { idempotencyKey }
      );
      await snapshot.ref.set(payment);
    } catch (error) {
      log({ message: error.message, data: error, context, level: 'error' });
      await snapshot.ref.set(
        { error: error.message },
        { merge: true }
      );
    }
  });

// const createSubscription = functions.firestore
//   .document('/stripe_customers/{userId}/subscriptions/{pushId}')
//   .onCreate(async (snapshot, context) => {
//     console.log('createSubscription');
//     const { customer_id } = (await snapshot.ref.parent.parent.get()).data();
//     const { pushId: idempotencyKey } = context.params;
//     console.log('Creating subscription for', customer_id);
//   });

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

const stripe_cancelSubscription = functions.https.onCall(async (data, context) => {
  log({ message: 'Billing: attempting to cancel subscription.', data: data, context });
  checkAuth(context);

  try {
    const { id } = data;
    const subscription = await stripe.subscriptions.del(id);

    log({ message: 'Billing: subscription canceled.', data: { id: subscription.id }, context });
    return { message: 'Subscription canceled.', subscription };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

/**
 * Sets billing tier for the user.
 * @param id - id of the new billing tier.
 */
const setTier = functions.https.onCall(async (data, context) => {
  checkAuth(context);
  const { id } = data;
  const { auth: { uid } } = context;

  // This should be custom claims, but for now we just put it on the user meta.
  const result = await admin.firestore().collection('users').doc(uid).update({
    tier: id
  });
});

const stripe_webhooks = express();
stripe_webhooks.use(bodyParser.urlencoded({ extended: false }));
stripe_webhooks.use(bodyParser.json());
stripe_webhooks.post(
  '/webhooks',
  async (request, response) => {
    try {
      const { body } = request;
      log({ message: 'Billing: Received Stripe webhook.', data: body });
      const {
        type,
        data: {
          object: {
            id,
            customer
          }
        }
      } = body;

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
  setTier,

  stripe_onCreateUser,
  stripe_onCreatePaymentMethod,
  stripe_onCreatePayment,
  stripe_onConfirmPayment,
  stripe_onDeleteUser,

  stripe_cancelSubscription,
  stripe: functions.https.onRequest(stripe_webhooks)
};
