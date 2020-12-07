const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fetch = require('node-fetch');

const { METHODS, getMethod } = require('./util/methods');
const { getDailyHeaders } = require('./util/headers');
const { apiKey } = require('./__config__/daily.json');

const recordingsFE = async (data = {}, context) => {
  const method = getMethod(data);
  switch (method) {
    case METHODS.GET: {
      const { endpoint = '' } = data;
      const result = await fetch(
        `https://api.daily.co/v1/recordings${endpoint && ('/' + endpoint)}`,
        {
          method: METHODS.GET,
          headers: getDailyHeaders()
        }
      );
      const json = await result.json();
      return { message: 'Done.', result: json, sentData: data };
    }

    case METHODS.POST: {
      console.log('DATA', data);
      // const { recording_id } = data;
      // const result = await fetch(
      //   `http://api.daily.co/v1/recordings/${recording_id}`,
      //   {
      //     headers: getDailyHeaders(),
      //     method: METHODS.GET
      //   }
      // );

      // const { recording_id, tracks } = data;
      // const body = {
      //   composite_mode: 'tracks-layout',
      //   size: '1280x720',
      //   tracks,
      //   title: 'Composite'
      // };
      // const result = await fetch(
      //   `http://api.daily.co/v1/recordings/${recording_id}/composites`,
      //   {
      //     method: METHODS.POST,
      //     headers: getDailyHeaders(),
      //     body: JSON.stringify(body)
      //   }
      // );

      // const json = await result.json();
      // console.log(json);
      return { message: 'Done.', result: {}, sentData: data };
    }

    default: {
      throw new functions.https.HttpsError(
        'unimplemented', `${method} is not implemented`, { sentData: data }
      );
    }
  }
};

module.exports = {
  recordingsFE: functions.https.onCall(recordingsFE)
};
