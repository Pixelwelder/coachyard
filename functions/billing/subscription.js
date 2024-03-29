const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');
const { log } = require ('../logging');
const { setClaims } = require('../util/claims');
const stripe = require('./stripe');

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

const tiers = [
  // { id: 0, displayName: 'Student', price: 0, period: 'forever', unitsName: 'hours', unitsAmount: 'unlimited' },
  { id: 1, displayName: 'Coach', price: 24.95, period: 'per month', unitsName: 'hours', unitsAmount: 15 },
  { id: 2, displayName: 'Mentor', price: 39.95, period: 'per month', unitsName: 'hours', unitsAmount: 30 },
  { id: 3, displayName: 'Guru', price: 99.95, period: 'per month', unitsName: 'hours', unitsAmount: 100 }
];

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

// TODO This should be related to the actual prices defined in Stripe.
const getTiers = functions.https.onCall((data, context) => {
  return tiers;
});

/**
 * Any time a user is deleted, we delete all record of (1) their Stripe Customer, and (2) their payment methods.
 * TODO This is totally untested.
 * TODO Also remove all sessions.
 * TODO Revisit this.
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

module.exports = {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  checkSubscription,
  getTiers,

  createPaymentMethod,
  stripe_onConfirmPayment,
  stripe_onDeleteUser,
};
