const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { log } = require('../logging');
const { setClaims } = require('../util/claims');

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
    log({ message: 'Mux: Received webhook.', data: body });

    const { type } = body;

    if (type === 'video.asset.ready') {
      const muxData = parseMuxResponse(body);

      const itemDoc = await admin.firestore().runTransaction(async (transaction) => {
        const procRef = admin.firestore().collection('mux_processing').doc(muxData.streamingId);
        const procDoc = await transaction.get(procRef);
        if (!procDoc) throw new Error(`Received webhook for streamingId ${muxData.streamingId} but it wasn't processing.`);
        const { courseUid, itemUid } = procDoc.data();

        const itemRef = admin.firestore()
          .collection('courses').doc(courseUid)
          .collection('items').doc(itemUid);
        const itemDoc = await transaction.get(itemRef);
        if (itemDoc.exists) {
          await transaction.update(itemRef, { ...muxData, status: 'viewing', streamingInfo: body });
          await transaction.delete(procRef);
          return itemDoc;
        } else {
          log({ message: `Did not find a doc for streaming id ${muxData.streamingId}.`, data: body, level: 'error' });
        }
      });

      const { creatorUid } = itemDoc.data();
      const user = await admin.auth().getUser(creatorUid);
      const { remaining } = user.customClaims;

      const { data: { duration = 0 } = {} } = body;
      await setClaims({ uid: creatorUid, claims: { remaining: remaining - (duration / 60) } });
    }

    return response.status(200).end();
  } catch (error) {
    log({ message: error.messge, data: error, level: 'error' });
    return response.status(500).end();
  }
});

module.exports = {
  mux: functions.https.onRequest(mux_webhooks)
}
