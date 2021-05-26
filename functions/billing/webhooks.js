const admin = require('firebase-admin');
const functions = require('firebase-functions');
const express = require('express');
const { log } = require ('../logging');
const stripe = require('./stripe');
const { webhook_secret } = require('../config').stripe;
const { deleteSessions } = require('./utils');
const { unlockCourse } = require('../courses/unlockCourse');

const stripe_webhooks = express();
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
  stripe: functions.https.onRequest(stripe_webhooks)
};
