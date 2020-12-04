const functions = require('firebase-functions');
const express = require('express');
const fetch = require('node-fetch');

const { METHODS, getMethod } = require('./util/methods');
const { getDailyHeaders } = require('./util/headers');

const app = express();
app.get('/', async (request, response) => {
  const result = await fetch(
    'https://api.daily.co/v1/rooms',
    {
      method: 'GET',
      headers: getDailyHeaders()
    }
  );

  const json = await result.json();

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
      headers: getDailyHeaders()
    }
  );

  const json = await result.json();

  return response
    .status(200)
    .json(json)
    .end();
});

const roomsFE = async (data, context) => {
  if (!context.auth) {
    console.error('No logged-in user.');
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user', { sentData: data });
  } else {
    const method = getMethod(data);

    switch (method) {
      case METHODS.GET: {
        const result = await fetch(
          'https://api.daily.co/v1/rooms',
          {
            method: METHODS.GET,
            headers: getDailyHeaders()
          }
        );

        const json = await result.json();
        return { message: 'Done.', result: json, sentData: data };
      }

      case METHODS.POST : {
        const { name } = data;

        const result = await fetch(
          'https://api.daily.co/v1/rooms',
          {
            method: METHODS.POST,
            headers: getDailyHeaders(),
            body: JSON.stringify({
              name,
              properties: {
                enable_recording: 'rtp-tracks'
              }
            })
          }
        );

        const json = await result.json();
        console.log(json);
        return { message: 'Done.', result: json, sentData: data }
      }

      case METHODS.DELETE: {
        const { endpoint } = data;
        console.log(`Deleting ${endpoint}...`);

        // TODO Role-based auth here.

        const result = await fetch(
          `https://api.daily.co/v1/rooms/${endpoint}`,
          {
            method: METHODS.DELETE,
            headers: getDailyHeaders()
          }
        );

        const json = await result.json();

        return { message: 'Done.', result: json, sentData: data }
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
