const functions = require('firebase-functions');
const fetch = require('node-fetch');

const { getMethod, METHODS } = require('./util/methods');
const { getMuxHeaders } = require('./util/headers');

const assetsFE = async (data = {}, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user.', { sentData: data });
  }

  const method = getMethod(data);
  const { id = '' } = data;
  switch(method) {
    case METHODS.GET: {
      const result = await fetch(
        `https://api.mux.com/video/v1/assets${id && '/' + id}`,
        {
          headers: getMuxHeaders(),
        }
      )

      const json = await result.json();
      if (json.error) {
        const { type, messages } = json.error;
        throw new functions.https.HttpsError(
          'unauthenticated',
          messages.reduce((accum, error) => `${accum}${accum.length ? ', ' : ''}${error}`, ''),
          { sentData: data }
        )
      }
      console.log(json);
      return { message: 'Done.', result: json, sentData: data };
    }

    default: {
      throw new Error('unimplemented', `${method} is not implemented`, { sentData: data });
    }
  }

};

module.exports = {
  assetsFE: functions.https.onCall(assetsFE)
}
