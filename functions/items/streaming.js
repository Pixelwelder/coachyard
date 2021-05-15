const admin = require('firebase-admin');
const functions = require('firebase-functions');
const fetch = require('node-fetch');
const { getMuxHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');

const sendItem = async (data, context) => {
  try {
    log({ message: 'Attempting to send item to streaming server...', data, context });
    checkAuth(context);
    const {
      courseUid,
      itemUid,
      params: { input, playback_policy }
    } = data;

    const itemRef = admin.firestore()
      .collection('courses').doc(courseUid)
      .collection('items').doc(itemUid);
    const itemDoc = await itemRef.get();
    const { streamingId: oldStreamingId } = itemDoc.data();

    const result = await fetch(
      'https://api.mux.com/video/v1/assets',
      {
        headers: getMuxHeaders(),
        method: METHODS.POST,
        body: JSON.stringify({
          input,
          playback_policy,
          test: true
        })
      }
    );

    const json = await result.json();
    const { data: { id: streamingId } } = json;
    log({ message: 'Created new streaming asset.', data: json, context });

    await admin.firestore().runTransaction(async (transaction) => {
      // Now record the result.
      await transaction.update(itemRef, { streamingId, status: 'processing' });

      // Also store it elsewhere for the webhook later.
      const procRef = admin.firestore().collection('mux_processing').doc(streamingId);
      const procItem = {
        awaiting: 'processing',
        courseUid,
        itemUid,
      };
      await transaction.set(procRef, procItem);
    });

    // Delete old one if necessary.
    if (oldStreamingId) {
      // Already exists. Delete it.
      log({ message: `Streaming exists. Deleting ${oldStreamingId}...`, data, context });
      const result = await fetch(
        `https://api.mux.com/video/v1/assets/${oldStreamingId}`,
        {
          method: METHODS.DELETE,
          headers: getMuxHeaders()
        }
      );
      try {
        console.log(result);
        const json = await result.json();
        log({ message: 'Existing streaming asset deleted.', data: json, context });
      } catch (error) {
        log({ message: 'Existing streaming asset could not be deleted.', data: json, context, level: 'error' });
        console.log('------ ERROR ------');
        console.log(error);
        console.log(result);
        console.log('-----------------------------------');
      }
    }

    log({ message: 'Updated database with streaming asset.', data: json, context });
    return { message: 'Done. I think.', result: json };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  sendItem: functions.https.onCall(sendItem)
};
