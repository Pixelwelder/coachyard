const fetch = require('node-fetch');
const { getDailyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');

const checkRoom = async ({ name }) => {
  const result = await fetch(
    `https://api.daily.co/v1/rooms/${name}`,
    {
      method: METHODS.GET,
      headers: getDailyHeaders()
    }
  );

  const json = await result.json();
  return json;
};

const local = 'http://3e8a8d635196.ngrok.io/coach-yard/us-central1/daily/webhooks';
const production = 'https://us-central1-coach-yard.cloudfunctions.net/daily/webhooks';
const webhookUrl = production;
const launchRoom = async ({ name }) => {
  const result = await fetch(
    `https://api.daily.co/v1/rooms`,
    {
      method: METHODS.POST,
      headers: getDailyHeaders(),
      body: JSON.stringify({
        name,
        properties: {
          enable_recording: 'local',//'rtp-tracks'
          meeting_join_hook: webhookUrl
        }
      })
    }
  );

  // This is ugly, but we don't have a webhook.
  // Therefore we add a delay before the "launch" is complete.
  // console.log('delaying...');
  // const delay = ms => new Promise(r => setTimeout(r, ms));
  // await delay(2000);
  // console.log('delay complete');

  const json = await result.json();
  console.log('result', json);
  return json;
};

const deleteRoom = async ({ name }) => {
  const result = await fetch(
    `https://api.daily.co/v1/rooms/${name}`,
    {
      method: METHODS.DELETE,
      headers: getDailyHeaders()
    }
  );

  const json = await result.json();
  return json;
};

module.exports = {
  checkRoom,
  launchRoom,
  deleteRoom
};
