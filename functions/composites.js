const functions = require('firebase-functions');
const fetch = require('node-fetch');

const { METHODS, getMethod } = require('./util/methods');
const { getDailyHeaders } = require('./util/headers');

const createCompositeFE = async (data, context) => {
  if (!context.auth) {
    console.error('No logged-in user.');
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user', { sentData: data });
  }

  const { id } = data;
  const result = await fetch(
    `http://api.daily.co/v1/recordings/${id}`,
    {
      headers: getDailyHeaders(),
      method: METHODS.GET
    }
  );

  console.log(id);
  const json = await result.json();
  console.log(json);

  const url = `https://api.daily.co/v1/recordings/${id}/composites`;
  const body = {
    composite_mode: 'tracks-layout',
    size: '1280x720',
    // Assume we get video, audio, video, audio
    tracks: json.tracks.map((track, index) => {
      const { id } = track;
      const trackObj = { id, title: id };
      if (index === 0) {
        trackObj.size = '1280x720';
        trackObj.position = '0x0'
      } else if (index === 2) {
        trackObj.size = '178x100';
        trackObj.position = '610x10';
      }
      return trackObj;
    })
  };

  const result2 = await fetch(
    url,
    {
      headers: getDailyHeaders(),
      method: METHODS.POST,
      body: JSON.stringify(body)
    }
  );

  const json2 = await result2.json();
  console.log(json2);

  return { message: 'Done.', result: json2, sentData: data };
};

const compositesFE = async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user.', { sentData: data });
  }

  const method = getMethod(data);
  switch(method) {
    case METHODS.GET: {
      const { id } = data;
      const result = await fetch(
        `http://api.daily.co/v1/recordings/${id}/composites`,
        {
          headers: getDailyHeaders(),
          method: METHODS.GET
        }
      );

      const json = await result.json();

      return { message: 'Done.', result: json, sentData: data };
    }

    default: {
      throw new functions.https.HttpsError('unimplemented', `${method} is unimplemented.`, { sentData: data });
    }
  }
};

module.exports = {
  createCompositeFE: functions.https.onCall(createCompositeFE),
  compositesFE: functions.https.onCall(compositesFE)
};
