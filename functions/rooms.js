const functions = require('firebase-functions');
const express = require('express');
const fetch = require('node-fetch');

const { apiKey } = require('./__config__/daily.json');

const app = express();
app.get('/', async (request, response) => {
  const result = await fetch(
    'https://api.daily.co/v1/rooms',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }
  );

  const json = await result.json();

  console.log(json);

  return response
    .status(200)
    .json(json)
    .end();
});

app.post('/', async (request, response) => {
  const { arg } = request.body;

  const result = await fetch(
    'https://api.daily.co/v1/rooms',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }
  );

  const json = await result.json();

  return response
    .status(200)
    .json(json)
    .end();
});

const roomsFE = async (data, context) => {
  console.log('CALLED', data, context.auth);
  let message = '';
  if (!context) {
    console.log('No logged-in user.');
    message += 'No logged-in user.';
  } else {
    const { uid } = context.auth;
    const { name, email } = context.auth.token;
    //
    // // throw new functions.https.HttpsError('some-code', 'Some message', { details: '' });
    message += `${name} ${email} ${uid}`;
  }

  return { message };
};

module.exports = {
  rooms: functions.https.onRequest(app),
  roomsFE: functions.https.onCall(roomsFE)
};
