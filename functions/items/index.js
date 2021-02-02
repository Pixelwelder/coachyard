const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders, getDailyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourseItem } = require('../data');
const { setClaims } = require('../util/claims');

/**
 * Filters user input for item creation.
 */
const filterItem = ({
  displayName,
  description,
  file: originalFilename = '',
  date
}) => ({
  displayName,
  description,
  originalFilename,
  date
});

const createItem = async (data, context) => {
  try {
    log({ message: 'Attempting to create item...', data, context });
    checkAuth(context);

    const { auth: { uid } } = context;
    const { courseUid, item: newItem } = data;

    const { item } = await admin.firestore().runTransaction(async (transaction) => {

      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) throw new Error(`No course by uid ${courseUid}.`)

      const course = courseDoc.data();
      if (course.creatorUid !== uid) throw new Error('Only the creator of a course can add an item.');

      const itemRef = admin.firestore().collection('items').doc();
      const timestamp = admin.firestore.Timestamp.now();
      const item = newCourseItem({
        uid: itemRef.id,
        creatorUid: uid,
        courseUid,
        created: timestamp,
        updated: timestamp,
        date: newItem.date,
        status: newItem.date ? 'scheduled' : 'viewing',
        ...filterItem(newItem)
      });

      // Add it to the items table.
      await transaction.create(itemRef, item);

      // Now update course.
      // await transaction.update(courseRef, { items: [ ...course.items, item.uid ]});
      return { item };
    });

    log({ message: 'Item successfully created.', data: item, context });
    return { message: `Added new course item to course ${courseUid}.`, item };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
  }
};

/**
 * Updates a single item in a course.
 *
 * @param itemUid - the item to update
 * @param update - an object of name-value pairs to update
 */
const updateItem = async (data, context) => {
  try {
    log({ message: 'Attempting to update item...', data, context });
    checkAuth(context);

    const { auth: { uid } } = context;
    const { uid: itemUid, update } = data;

    if (!update) throw new Error('Update param required.');

    const { item } = await admin.firestore().runTransaction(async (transaction) => {
      // Grab the item.
      const itemRef = admin.firestore().collection('items').doc(itemUid);
      const itemDoc = await transaction.get(itemRef);
      const itemData = itemDoc.data();
      if (itemData.creatorUid !== uid) throw new Error(`User ${uid} did not create item ${itemUid}.`);

      // Update it (but let's not be too trusting).
      const filteredUpdate = filterItem(update);
      await transaction.update(itemRef, filteredUpdate);
      return { item: { ...itemData, ...filteredUpdate } };
    });

    log({ message: 'Item successfully updated.', data: item, context });
    return { message: 'Item updated.', item };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Deletes an item from a course.
 * Requires that the caller be the creator of the course.
 *
 * @param courseUid
 * @param index
 */
const deleteItem = async (data, context) => {
  try {
    log({ message: 'Attempting to delete item...', data, context });
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: itemUid } = data;

    const { item } = await admin.firestore().runTransaction(async (transaction) => {
      const itemRef = admin.firestore().collection('items').doc(itemUid);
      const itemDoc = await itemRef.get();
      const itemData = itemDoc.data();
      if (itemData.creatorUid !== uid) throw new Error(`User ${uid} did not create item ${itemUid}.`);

      await transaction.delete(itemRef);

      return { item: itemData };
    });

    log({ message: 'Successfully deleted item from database.', data: item, context });

    const result = await fetch(
      `https://api.mux.com/video/v1/assets/${item.streamingId}`,
      {
        method: METHODS.DELETE,
        headers: getMuxHeaders()
      }
    );
    const json = await result.json();

    // TODO Error?
    log({ message: 'Successfully deleted item from streaming server.', data: json, context });
    return { message: 'Item removed.', result };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const sendItem = async (data, context) => {
  try {
    log({ message: 'Attempting to send item to streaming server...', data, context });
    checkAuth(context);
    const {
      uid,
      params: { input, playback_policy }
    } = data;

    const itemRef = admin.firestore().collection('items').doc(uid);
    const itemDoc = await itemRef.get();
    const itemData = itemDoc.data();
    if (itemData.streamingId) {
      // Already exists. Delete it.
      log({ message: 'Streaming exists. Deleting...', data, context });
      const result = await fetch(
        `https://api.mux.com/video/v1/assets/${itemData.streamingId}`,
        {
          method: METHODS.DELETE,
          headers: getMuxHeaders()
        }
      );
      const json = await result.json();
      log({ message: 'Existing streaming asset deleted.', data: json, context });
    }

    const result = await fetch(
      'https://api.mux.com/video/v1/assets',
      {
        headers: getMuxHeaders(),
        method: METHODS.POST,
        body: JSON.stringify({
          input,
          playback_policy,
          // test: true
        })
      }
    );

    const json = await result.json();
    log({ message: 'Created new streaming asset.', data: json, context });

    // Now record the result.
    await itemRef.update({ streamingId: json.data.id, status: 'processing' });

    log({ message: 'Updated database with streaming asset.', data: json, context });
    return { message: 'Done. I think.', result: json };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const _checkRoom = async ({ name }) => {
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
const _launchRoom = async ({ name }) => {
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

const _deleteRoom = async ({ name }) => {
  const result = await fetch(
    `https://api.daily.co/v1/rooms/${name}`,
    {
      method: METHODS.DELETE,
      headers: getDailyHeaders()
    }
  );

  const json = await result.json();
  return json;
}

const handleItemUpdate = functions.firestore
  .document('items/{docId}')
  .onUpdate(async (change, context) => {
    const { docId } = context.params;
    log({ message: `Item ${docId} has been updated.`, data: change.after.data(), context });

    const oldValue = change.before.data();
    const newValue = change.after.data();

    // If we move from 'scheduled' to 'initializing', start a room.
    if (oldValue.status === 'scheduled' && newValue.status === 'initializing') {
      const update = {};

      const existingRoom = await _checkRoom({ name: docId });
      if (!existingRoom.error) {
        // The room already exists, which means something is screwed up before now.
        log({ message: 'Room already exists.', data: existingRoom, context, level: 'warning' });
        update.room = existingRoom;
      } else {
        // The room does not exist. Create it.
        log({ message: 'Attempting to launch room...', data: change.after.data(), context });
        const newRoom = await _launchRoom({ name: docId });
        if (newRoom.error) {
          // There was a problem creating the room.
          // Change back to previous status.
          update.status = 'scheduled';
          log({ message: newRoom.error, data: newRoom, context, level: 'error' });
        } else {
          update.room = newRoom;
          update.status = 'live';
          update.started = admin.firestore.Timestamp.now();
          log({ message: 'Successfully launched room.', data: newRoom, context });
        }
      }

      // Update record.
      const ref = admin.firestore().collection('items').doc(docId);
      await ref.update(update);

      // If we move from 'live' to 'uploading', delete a room.
    } else if (oldValue.status === 'live' && newValue.status === 'uploading') {
      const update = { started: false };

      // Does it exist?
      const existingRoom = await _checkRoom({ name: docId });
      if (existingRoom.error) {
        // It does not exist, which is a problem somewhere else.
        // Still, we can delete it.
        log({ message: 'Attempted to delete a room that does not exist.', data: existingRoom, context, level: 'error' });
        update.room = false;
      } else {
        // It exists. Delete it.
        const room = await _deleteRoom({ name: docId });
        if (room.error) {
          // There was a problem deleting the (existing) room.
          // That means we're still live.
          log({ message: 'Could not delete existing room.', data: room, context, level: 'error' });
          update.status = 'live';
        } else {
          // We successfully deleted the room. Update the record.
          log({ message: 'Successfully deleted room.', data: room, context });
          update.room = false;
        }
      }

      const ref = admin.firestore().collection('items').doc(docId);
      await ref.update(update);

      // Stop counting and subtract time from what user has left.
      const then = oldValue.started.toDate();
      const now = admin.firestore.Timestamp.now().toDate();
      const used = now - then;

      const { creatorUid } = oldValue;
      const user = await admin.auth().getUser(creatorUid);
      const { remaining = 0 } = user.customClaims;
      setClaims({ uid: creatorUid, remaining: remaining - used });

      log({ message: 'Updated item based on room result.', data: update, context });
    }
  });

// TODO Can't test these right now.
const handleFileUpload = functions.storage
  .bucket('coach-yard-uploads')
  .object()
  .onFinalize(async (object, context) => {
    console.log('uploaded', object.name);
  });

const handleFileDelete = functions.storage
  .bucket('coach-yard-uploads')
  .object()
  .onDelete((object, context) => {
    console.log('deleted', object.name);
  });

const beginRecording = functions.https.onCall((data, context) => {
  try {
    const { auth: { uid } } = context;
    const { uid: itemUid } = data;

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

const endRecording = functions.https.onCall((data, context) => {
  try {

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

module.exports = {
  createItem: functions.https.onCall(createItem),
  updateItem: functions.https.onCall(updateItem),
  deleteItem: functions.https.onCall(deleteItem),
  sendItem: functions.https.onCall(sendItem),

  beginRecording,
  endRecording,

  handleItemUpdate,

  // handleFileUpload,
  // handleFileDelete
}
