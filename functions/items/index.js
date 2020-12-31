const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourseItem } = require('../data');

/**
 * Filters user input for item creation.
 */
const filterItem = ({
  displayName,
  description,
  file: originalFilename,
  date
}) => ({
  displayName,
  description,
  originalFilename,
  date
});

const addItemToCourse = async (data, context) => {
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
        status: newItem.date ? 'scheduled' : 'viewable',
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

const parseMuxResponse = ({ data: { playback_ids, id } }) => ({
  playbackId: playback_ids[0].id,
  streamingId: id
});

const sendItemToStreamingService = async (data, context) => {
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
        body: JSON.stringify({ input, playback_policy, test: true })
      }
    );

    const json = await result.json();
    console.log('result', json);

    // Now record the result.
    await itemRef.update(parseMuxResponse(json));

    return { message: 'Done. I think.', result: json };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  addItemToCourse: functions.https.onCall(addItemToCourse),
  updateItem: functions.https.onCall(updateItem),
  deleteItem: functions.https.onCall(deleteItem),
  sendItemToStreamingService: functions.https.onCall(sendItemToStreamingService)
}
