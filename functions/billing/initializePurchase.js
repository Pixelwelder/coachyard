const admin = require('firebase-admin');
const functions = require('firebase-functions');
const stripe = require('../billing/stripe');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');

/**
 * Begin the purchase process.
 *
 * @param data
 * @param context
 * @returns {Promise<{sessionId: string}>}
 */
const initializePurchase = async (data, context) => {
  try {
    checkAuth(context);

    const { auth: { token: { uid, email } } } = context;
    const { uid: courseUid, url } = data;
    console.log('checking course', courseUid);
    const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
    if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);
    console.log('got course', courseUid);

    console.log('checking tokens');
    const tokenDocs = await admin.firestore().collection('tokens')
      .where('parent', '==', courseUid)
      .where('user', '==', uid).get();
    if (tokenDocs.size) throw new Error(`User ${uid} already owns a descendant of ${courseUid}.`);

    console.log('getting customer');
    console.log('Getting Stripe customer');
    const customerDoc = await admin.firestore().collection('stripe_customers').doc(uid).get();
    if (!customerDoc.exists) throw new Error(`Customer ${uid} doesn't exist.`);
    console.log('got Stripe customer');

    const course = courseDoc.data();
    const customer = customerDoc.data();

    const baseLineItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Unlock: ${course.displayName}`,
          description: course.description || course.displayName
        },
        unit_amount: course.price,
      },
      quantity: 1
    };

    let sessionData = {
      payment_method_types: ['card'],
      success_url: url,
      cancel_url: url,

      // Pass this so it will attach to existing customer.
      customer: customer.id,
      customer_email: email,

      metadata: {
        studentUid: uid,
        courseUid
      }
    };

    switch (course.priceFrequency) {
      case 'one-time': {
        sessionData = {
          ...sessionData,
          mode: 'payment',
          payment_intent_data: {
            // Attach payment method to the customer.
            setup_future_usage: 'off_session'
          },
          line_items: [baseLineItem]
        };
        break;
      }
      case 'month': {
        sessionData = {
          ...sessionData,
          mode: 'subscription',
          line_items: [{
            ...baseLineItem,
            price_data: {
              ...baseLineItem.price_data,
              recurring: { interval: 'month' }
            }
          }],
        };
        break;
      }
      default: {
        throw new Error(`Unhandled priceFrequency "${course.priceFrequency}".`);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log('Session created', session.id);
    console.log('session saved');
    await customerDoc.ref.collection('sessions').doc(courseUid)
      .collection('sessions').doc(session.id)
      .set({
        courseUid,
        session
      });
    return { sessionId: session.id };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  initializePurchase: functions.https.onCall(initializePurchase),
};
