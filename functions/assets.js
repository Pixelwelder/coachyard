const functions = require('firebase-functions');
const fetch = require('node-fetch');

const { getMethod, METHODS } = require('./util/methods');
const { getMuxHeaders } = require('./util/headers');
const { checkAuth } = require('./util/auth');

const getUrl = (data) => {
  const { id = '', endpoint = '' } = data;
  let url = 'https://api.mux.com/video/v1/assets';
  if (id) url = `${url}/${id}`;
  if (endpoint) url = `${url}/${endpoint}`;

  return url;
};

const getOpts = (data) => {
  const method = getMethod(data);
  const opts = {
    headers: getMuxHeaders(),
    method
  };

  if (data.body) opts.body = JSON.stringify(data.body);

  return opts;
};

const assetsFE = async (data = {}, context) => {
  checkAuth(context);
  // TODO Check authorization.

  const url = getUrl(data);
  const opts = getOpts(data);

  console.log(opts.method, url);
  const result = await fetch(url, opts);
  const json = await result.json();

  if (json.error) {
    const { type, messages } = json.error;
    console.error(json.error);
    throw new functions.https.HttpsError(
      'internal',
      messages.reduce((accum, error) => `${accum}${accum.length ? ', ' : ''}${error}`, ''),
      { sentData: data }
    )
  }
  // console.log(json);
  return { message: 'Done.', result: json, sentData: data };
};

module.exports = {
  assetsFE: functions.https.onCall(assetsFE)
}
