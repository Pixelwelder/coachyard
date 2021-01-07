const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders, getDailyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourseItem } = require('../data');
const express = require('express');
const bodyParser = require('body-parser');

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
    checkAuth(context);

    const { auth: { uid } } = context;
    const { courseUid, item: newItem } = data;

    console.log('addItemToCourse', data);
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
      console.log('adding item', item);
      await transaction.create(itemRef, item);

      // Now update course.
      // await transaction.update(courseRef, { items: [ ...course.items, item.uid ]});
      return { item };
    });

    return { message: `Added new course item to course ${courseUid}.`, item };
  } catch (error) {
    console.error(error);
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

    return { message: 'Item updated.', item };
  } catch (error) {
    console.error(error);
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
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: itemUid } = data;

    console.log('deleteItem', data);

    const { item } = await admin.firestore().runTransaction(async (transaction) => {
      console.log(itemUid);
      const itemRef = admin.firestore().collection('items').doc(itemUid);
      const itemDoc = await itemRef.get();
      const itemData = itemDoc.data();
      if (itemData.creatorUid !== uid) throw new Error(`User ${uid} did not create item ${itemUid}.`);

      await transaction.delete(itemRef);

      return { item: itemData };
    });

    console.log('deleting from streaming service', item);
    const result = await fetch(
      `https://api.mux.com/video/v1/assets/${item.streamingId}`,
      {
        method: METHODS.DELETE,
        headers: getMuxHeaders()
      }
    );
    console.log(result);

    return { message: 'Item removed.', result };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const sendItem = async (data, context) => {
  try {
    checkAuth(context);
    const {
      uid,
      params: { input, playback_policy }
    } = data;

    console.log(data);
    const itemRef = admin.firestore().collection('items').doc(uid);
    const itemDoc = await itemRef.get();
    const itemData = itemDoc.data();
    if (itemData.streamingId) {
      // Already exists. Delete it.
      console.log('Deleting existing streaming asset...');
      const result = await fetch(
        `https://api.mux.com/video/v1/assets/${itemData.streamingId}`,
        {
          method: METHODS.DELETE,
          headers: getMuxHeaders()
        }
      );
      console.log('Deleted', result);
    }

    const result = await fetch(
      'https://api.mux.com/video/v1/assets',
      {
        headers: getMuxHeaders(),
        method: METHODS.POST,
        body: JSON.stringify({ input, playback_policy })
      }
    );

    const json = await result.json();
    console.log('result', json);

    // Now record the result.
    await itemRef.update({ streamingId: json.data.id, status: 'processing' });

    return { message: 'Done. I think.', result: json };
  } catch (error) {
    console.error(error);
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
const webhookUrl = local;
const _launchRoom = async ({ name }) => {
  console.log('_launchRoom', name);
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
    const oldValue = change.before.data();
    const newValue = change.after.data();

    console.log('item has changed', docId, newValue);

    // If we move from 'scheduled' to 'initializing', start a room.
    if (oldValue.status === 'scheduled' && newValue.status === 'initializing') {
      const update = {};

      console.log('checking room');
      const existingRoom = await _checkRoom({ name: docId });
      if (!existingRoom.error) {
        // The room already exists, which means something is screwed up before now.
        console.error('Room already exists.');
        update.room = existingRoom;
      } else {
        // The room does not exist. Create it.
        console.log('creating room', docId);
        const newRoom = await _launchRoom({ name: docId });
        if (newRoom.error) {
          // There was a problem creating the room.
          // Change back to previous status.
          update.status = 'scheduled';
        }

        update.room = newRoom;
        update.status = 'live';
      }

      // Update record.
      const ref = admin.firestore().collection('items').doc(docId);
      await ref.update(update);

      // If we move from 'live' to 'processing', delete a room.
    } else if (oldValue.status === 'live' && newValue.status === 'processing') {
      console.log('deleting room', docId);
      const update = {};

      // Does it exist?
      const existingRoom = await _checkRoom({ name: docId });
      if (existingRoom.error) {
        // It does not exist, which is a problem somewhere else.
        // Still, we can delete it.
        console.error('Room does not exist.');
        update.room = false;
      } else {
        // It exists. Delete it.
        const room = await _deleteRoom({ name: docId });
        if (room.error) {
          // There was a problem deleting the (existing) room.
          // That means we're still live.
          console.error(room.error);
          update.status = 'live';
        } else {
          // We successfully deleted the room. Update the record.
          update.room = false;
        }
      }

      const ref = admin.firestore().collection('items').doc(docId);
      await ref.update(update);
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

// Webhooks.
const daily_webhooks = express();
daily_webhooks.use(bodyParser.urlencoded({ extended: false }));
daily_webhooks.use(bodyParser.json());
daily_webhooks.post('/webhooks', async (request, response) => {
  const { body } = request;
  console.log('daily webhook', body);

  return response.status(200).end();
});

module.exports = {
  createItem: functions.https.onCall(createItem),
  updateItem: functions.https.onCall(updateItem),
  deleteItem: functions.https.onCall(deleteItem),
  sendItem: functions.https.onCall(sendItem),

  handleItemUpdate,

  daily: functions.https.onRequest(daily_webhooks)

  // handleFileUpload,
  // handleFileDelete
}
