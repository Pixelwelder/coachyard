const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders, getDailyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourseItem } = require('../data');
const { filterItem, checkRoom } = require('./utils');
const { launchRoom, deleteRoom } = require('./conferencing');

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

      const itemRef = courseRef.collection('items').doc();
      const timestamp = admin.firestore.Timestamp.now();
      const item = newCourseItem({
        uid: itemRef.id,
        creatorUid: uid,
        courseUid,
        created: timestamp,
        updated: timestamp,
        date: newItem.date,
        ...filterItem(newItem)
      });

      // Add it to the course.
      await transaction.set(itemRef, item);

      // Now update course.
      // Where we put the item ID depends on what kind of item we're dealing with.
      const arrayName = item.type === 'template' ? 'localItemOrder' : 'itemOrder';
      await transaction.update(courseRef, { [arrayName]: admin.firestore.FieldValue.arrayUnion(itemRef.id) });

      // await transaction.update(courseRef, { items: [ ...course.items, item.uid ]});
      return { item };
    });

    log({ message: 'Item successfully created.', data: item, context });
    return { message: `Added new course item to course ${courseUid}.`, item };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
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
    const { courseUid, itemUid, update } = data;

    if (!update) throw new Error('Update param required.');

    const { item } = await admin.firestore().runTransaction(async (transaction) => {
      // Grab the item.
      const itemRef = admin.firestore()
        .collection('courses').doc(courseUid)
        .collection('items').doc(itemUid);
      const itemDoc = await transaction.get(itemRef);
      const itemData = itemDoc.data();
      if (itemData.creatorUid !== uid) throw new Error(`User ${uid} did not create item ${itemUid}.`);

      // Update it (but let's not be too trusting).
      const filteredUpdate = filterItem(update);
      console.log('filteredUpdate', filteredUpdate);
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
    const { courseUid, itemUid } = data;
    console.log(courseUid, itemUid);

    const { item } = await admin.firestore().runTransaction(async (transaction) => {
      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const itemRef = courseRef.collection('items').doc(itemUid);

      const courseDoc = await transaction.get(courseRef);
      const course = courseDoc.data();

      const itemDoc = await transaction.get(itemRef);
      const item = itemDoc.data();

      if (course.creatorUid !== uid) throw new Error(`User ${uid} did not create item ${itemUid}.`);

      // Delete the actual item.
      await transaction.delete(itemRef);

      // Now remove the reference.
      const updatedCourse = {
        ...course,
        itemOrder: course.itemOrder.filter(uid => uid !== itemUid),
        localItemOrder: course.localItemOrder.filter(uid => uid !== itemUid)
      };
      await transaction.update(courseRef, updatedCourse);

      return { item: item };
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

module.exports = {
  createItem: functions.https.onCall(createItem),
  updateItem: functions.https.onCall(updateItem),
  deleteItem: functions.https.onCall(deleteItem),

  ...require('./streaming'),
  ...require('./handlers')
}
