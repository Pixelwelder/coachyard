const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fetch = require('node-fetch');

const { METHODS, getMethod } = require('./util/methods');
const { getHeaders } = require('./util/headers');
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
          headers: getHeaders()
        }
      );
      const json = await result.json();
      return { message: 'Done.', result: json, sentData: data };
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
