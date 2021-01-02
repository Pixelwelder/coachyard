const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const parseMuxResponse = ({ data: { playback_ids, id } }) => ({
  playbackId: playback_ids[0].id,
  streamingId: id
});

const mux_webhooks = express();
mux_webhooks.use(bodyParser.urlencoded({ extended: false }));
mux_webhooks.use(bodyParser.json());
mux_webhooks.post('/webhooks', async (request, response) => {
  try {
    const { body } = request;
    const { type } = body;
    console.log('mux webhook:', type);

    if (type === 'video.asset.ready') {
      const muxData = parseMuxResponse(body);
      console.log(muxData);

      const updateResult = await admin.firestore().runTransaction(async (transaction) => {
        const itemRef = admin.firestore()
          .collection('items')
          .where('streamingId', '==', muxData.streamingId);
        const docs = await transaction.get(itemRef);
        if (docs.size) {
          const doc = docs.docs[0];
          await transaction.update(doc.ref, { ...muxData, status: 'viewing' });
        } else {
          console.error('No doc for', muxData.streamingId);
        }
      });
    }
    return response.status(200).end();
  } catch (error) {
    console.error(error);
    return response.status(500).end();
  }
});

module.exports = {
  mux: functions.https.onRequest(mux_webhooks)
}
