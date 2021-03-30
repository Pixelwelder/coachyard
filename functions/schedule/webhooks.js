const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { log } = require('../logging');

const webhooks = express();
webhooks.use(bodyParser.urlencoded({ extended: false }));
webhooks.use(bodyParser.json());
webhooks.post('/webhooks', async (request, response) => {
  console.log('REQUEST', request.body);
  try {
    // TODO What timezone??
    const { id_users_provider, id_users_customer, start_datetime, end_datetime, item } = request.body;
    const start = new Date(start_datetime).toISOString();
    const end = new Date(end_datetime).toISOString();
    console.log(id_users_provider, id_users_customer, item, start, end);

    // Grab the existing item and update it with a date.
    await admin.firestore().runTransaction(async (transaction) => {
       const providerRef = admin.firestore().collection('easy_providers')
         .where('id', '==', id_users_provider);

       const customerRef = admin.firestore().collection('easy_customers')
         .where('id', '==', id_users_customer);

       // const customerDocs = await transaction.get(customerRef);
       // if (!customerDocs.size) throw new Error(`No customer by ID ${id_users_customer}.`);
       // const customerUid = customerDocs.docs[0].id;
       // console.log('Customer', id_users_customer, customerUid);

       const itemRef = admin.firestore().collection('items').doc(item);
       await transaction.update(itemRef, { date: start, dateEnd: end });
    });

    // const { body } = request;
    // log({ message: 'Mux: Received webhook.', data: body });
  } catch (error) {
    console.log('error', error);
  }

  return response.status(200).end();
});

webhooks.get('/webhooks', (request, response) => {
  console.log('schedule webhook!');
});

module.exports = {
  schedule: functions.https.onRequest(webhooks)
};
