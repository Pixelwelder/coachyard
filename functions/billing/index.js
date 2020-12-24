const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Stripe } = require('stripe');
const{ newStripeCustomer, newStripePayment } = require('../data');

const stripe = new Stripe(
  functions.config().stripe.secret_key,
  { apiVersion: '2020-08-27' }
);

const createStripeCustomer = functions.auth.user()
  .onCreate(async (user) => {
    console.log('Billing: user created:', user.email);
    const timestamp = admin.firestore.Timestamp.now();
    const stripeCustomer = await stripe.customers.create({ email: user.email });
    const stripeIntent = await stripe.setupIntents.create({ customer: stripeCustomer.id });
    const fbCustomer = newStripeCustomer({
      uid: user.uid,
      created: timestamp,
      updated: timestamp,
      customer_id: stripeCustomer.id,
      setup_secret: stripeIntent.client_secret
    });
    await admin.firestore().collection('stripe_customers').doc(user.uid).set(fbCustomer);
    return;
  });

const deleteStripeCustomer = functions.auth.user()
  .onDelete(async (user) => {
    console.log('Billing: user deleted', user.email);
    const dbRef = admin.firestore().collection('stripe_customers');
    const customer = (await dbRef.doc(user.uid).get()).data();
    const snapshot = await dbRef.doc(user.uid).collection('payment_methods').get();
    snapshot.forEach(doc => doc.ref.delete());
    await dbRef.doc(user.uid).delete();
  });

/**
 * The payment method doc is added on the client. This function hears it and creates the Stripe counterpart.
 */
const addPaymentMethodDetails = functions.firestore
  .document('/stripe_customers/{userId}/payment_methods/{pushId}')
  .onCreate(async (snapshot, context) => {
    console.log('Billing: addPaymentMethodDetails');
    try {
      // Grab and save the payment method.
      const paymentMethodId = snapshot.data().id;
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      await snapshot.ref.set(paymentMethod);

      const intent = await stripe.setupIntents.create({ customer: `${paymentMethod.customer}` });
      await snapshot.ref.parent.parent.set(
        { setup_secret: intent.client_secret },
        { merge: true }
      );
      return;
    } catch (error) {
      console.error(error);
      await snapshot.ref.set(
        { error: error.message },
        { merge: true }
      );
    }
  });

/**
 * The payment doc is added on the client. This function hears it and creates the payment itself.
 */
const createStripePayment = functions.firestore
  .document('/stripe_customers/{userId}/payments/{pushId}')
  .onCreate(async (snapshot, context) => {
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
      console.error(error);
      await snapshot.ref.set(
        { error: error.message },
        { merge: true }
      );
    }
  });

/**
 * Reconfirm payment after authentication for 3D Secure.
 */
const confirmStripePayment = functions.firestore
  .document('/stripe_customers/{userId}/payments/{pushId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().status === 'requires_confirmation') {
      const payment = await stripe.paymentIntents.confirm(change.after.data().id);
      await change.after.ref.set(payment);
    }
  });

module.exports = {
  createStripeCustomer,
  addPaymentMethodDetails,
  createStripePayment,
  deleteStripeCustomer
};
