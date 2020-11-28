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
  let message = '';
  if (!context.auth) {
    console.error('No logged-in user.');
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user', { sentData: data });
  } else {
    const { uid } = context.auth;
    const { name, email } = context.auth.token;
    const { method: _method = 'get' } = {} = data;
    const method = _method.toLowerCase();

    switch (method) {
      case 'get': {
        const result = await fetch(
          'https://api.daily.co/v1/rooms',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`
            }
          }
        );

        const data = await result.json();
        return { message: 'Done.', data };
      }

      default: {
        throw new functions.https.HttpsError('unimplemented', `${method} is not implemented`, { sentData: data });
      }
    }
  }
};

module.exports = {
  rooms: functions.https.onRequest(app),
  roomsFE: functions.https.onCall(roomsFE)
};
