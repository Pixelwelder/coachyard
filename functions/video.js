const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fs = require('fs');
const util = require('util');
const pipeline = require('stream').pipeline;
const streamPipeline = util.promisify(pipeline);
const fetch = require('node-fetch');
const express = require('express');
const { getDailyHeaders } = require('./util/headers');
const { METHODS } = require('./util/methods');
const { daily } = require('./__config__/urls.json')

const app = express();

const getRecording = async({ recording_id }) => {
  const url = `${daily}/v1/recordings/${recording_id}`;
  const result = await fetch(
    url,
    {
      headers: getDailyHeaders(),
      method: METHODS.GET
    }
  );

  console.log(result);
};

const getVideo = async ({ recording_id }) => {
  const url = `${daily}/v1/recordings/${recording_id}/composites`;

  const result = await fetch(
    url,
    {
      headers: getDailyHeaders(),
      method: METHODS.GET
    }
  );

  const json = await result.json();
  console.log(json);
  return json;

  if (json.error) {
    console.log(`No recording by ID ${recording_id}.`);
    throw new Error(json.error);
  }

  // If there's a recording, is there a composite?
  if (!json.newest_composite) {
    console.log(`No composite for ${recording_id}.`);
    throw new Error(`No composite for ${recording_id}.`);
  }

  const { newest_composite: { download_url } } = json;
  console.log(`download composite from ${download_url}`)

  const result2 = await fetch(
    `${daily}${download_url}`,
    {
      headers: getDailyHeaders(),
      method: METHODS.GET
    }
  );
  console.log('Ok?', result2.ok);
  if (!result2.ok) throw new Error(result2.statusText);
  console.log('Composite downloaded. Saving to disk');
  await streamPipeline(result2.body, fs.createWriteStream('./download.mp4'));
  console.log('Composite saved.');
  return json;
};

const videoFE = (data, context) => {

};

app.get('/', async (request, response) => {
  try {
    const { query: { recording_id } = {} } = request;
    console.log(request.query);
    if (!recording_id) throw new Error('Please supply a recording_id query param.');
    //
    // const fileRef = admin.storage().bucket()

    await getRecording({ recording_id });

    return response
      .status(200)
      .json({ message: 'Ok.' })
      .end();
  } catch (error) {
    return response
      .status(200)
      .json({ error: error.message })
      .end();
  }
});

module.exports = {
  video: functions.https.onRequest(app),
  videoFE: functions.https.onCall(videoFE)
};
