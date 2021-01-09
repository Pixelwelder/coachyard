const functions = require('firebase-functions');
const express = require('express');
const bodyParser = require('body-parser');
const { log } = require('../logging');

// Webhooks.
const daily_webhooks = express();
daily_webhooks.use(bodyParser.urlencoded({ extended: false }));
daily_webhooks.use(bodyParser.json());
daily_webhooks.post('/webhooks', async (request, response) => {
  const { body } = request;
  log({ message: 'Received Daily.co webhook.', data: body });

  return response.status(200).end();
});

module.exports = {
  daily: functions.https.onRequest(daily_webhooks)
};
