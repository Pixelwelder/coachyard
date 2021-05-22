const express = require('express');
const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { DateTime } = require('luxon');
const { log } = require('../logging');

const webhooks = express();
webhooks.use(bodyParser.urlencoded({ extended: false }));
webhooks.use(bodyParser.json());
webhooks.post('/webhooks', async (request, response) => {
  console.log('REQUEST', request.body);
  try {
    // TODO What timezone??
    const {
      id_users_provider, id_users_customer, start_datetime, end_datetime, course: courseUid, item: itemUid
    } = request.body;
    const start = DateTime.fromFormat(start_datetime, 'yyyy-MM-dd hh:mm:ss').toISO();
    const end = DateTime.fromFormat(end_datetime, 'yyyy-MM-dd hh:mm:ss').toISO();
    console.log(id_users_provider, id_users_customer, courseUid, itemUid, start_datetime, start, end_datetime, end);

    // Grab the existing item and update it with a date.
    await admin.firestore().runTransaction(async (transaction) => {
       const itemRef = admin.firestore()
         .collection('courses').doc(courseUid)
         .collection('items').doc(itemUid);
       await transaction.update(itemRef, { date: start, dateEnd: end });
    });
  } catch (error) {
    console.log('error', error);
  }

  return response.status(200).end();
});

const calendsoWebhooks = express();
calendsoWebhooks.get('/', async (request, response) => {
  console.log('GET request received');
  response.status(200).end();
});

calendsoWebhooks.post('/', async (request, response) => {
  try {
    console.log('webhook received', request.body);
  } catch (error) {

  }

  return response.status(200).end();
});

webhooks.get('/webhooks', (request, response) => {
  console.log('schedule webhook!');
});

module.exports = {
  schedule: functions.https.onRequest(webhooks)
};
