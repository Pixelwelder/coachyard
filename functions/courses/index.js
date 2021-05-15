const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { tokenUpdateFromCourse, tokenFromCourse2, getChildCourseUpdate, filterCourseItem } = require('./utils');
const { newCourse, newCourseItem, newCourseToken } = require('../data');
const { uploadImage } = require('./images');
const { initializePurchase } = require('./initializePurchase');
const stripe = require('../billing/stripe');

const tokenFromCourse = (course, user) => {
  return {
    ...tokenUpdateFromCourse(course),
    access: 'student',
    type: 'basic',
    user: user.uid,
    userDisplayName: user.displayName
  };
};

/**
 * A simpler createCourse.
 * @param data.displayName
 * @param data.type - see data/newCourse()
 */
const createCourse2 = async (data, context) => {
  try {
    log({ message: 'Attempting to create course...', data, context });
    checkAuth(context);

    const { auth: { token: { uid, email, name: teacherName } } } = context;
    const { displayName, type } = data;

    const course = await admin.firestore().runTransaction(async (transaction) => {
      // Add a course object to the database.
      const courseRef = admin.firestore().collection('courses').doc();
      const timestamp = admin.firestore.Timestamp.now();
      const course = newCourse({
        uid: courseRef.id,
        creatorUid: uid,
        displayName,
        type,
        created: timestamp,
        updated: timestamp
      });
      await transaction.set(courseRef, course);

      // Now add the teacher's token to the database.
      const { data, ref } = tokenFromCourse2(
        course,
        { uid, displayName: teacherName },
        {
          access: 'admin',
          courseUid: courseRef.id,
          type
        }
      );
      await transaction.create(ref, data);

      return course;
    });

    // Don't really need to wait for this.
    await uploadImage({
      path: './courses/generic-teacher-cropped.png',
      destination: `courses/${course.uid}.png`
    });

    return course;
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const updateCourse = async (data, context) => {
  try {
    log({ message: 'Attempting to update course...', data, context });
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: courseUid, update } = data;

    await admin.firestore().runTransaction(async (transaction) => {
      const ref = admin.firestore().collection('courses').doc(courseUid);
      const doc = await transaction.get(ref);
      const course = doc.data();
      if (course.creatorUid !== uid) throw new Error(`User ${uid} cannot update course ${course.uid}.`);

      const filteredCourseItem = filterCourseItem(update);

      // We also need to update all descendants.
      // TODO This is not very scalable.
      const childCourses = await transaction.get(
        admin.firestore().collection('courses').where('parent', '==', ref.id)
      );

      // And the tokens. TODO Also not scalable...?
      const tokens = await transaction.get(
        admin.firestore().collection('tokens').where('courseUid', '==', course.uid)
      );
      console.log('Found parent token', tokens.size);

      const childTokens = await Promise.all(childCourses.docs.map(async childCourseDoc => {
        const _childTokens = await admin.firestore().collection('tokens')
          .where('courseUid', '==', childCourseDoc.id);
        console.log(_childTokens.size);
        return _childTokens;
      }));

      console.log(`Found ${childTokens.size} child tokens.`);

      if (childCourses.size) {
        console.log(`Updating ${childCourses.size} child courses...`);
        if (childCourses.size > 450) log({ message: 'updateCourse: Too many children!', data, context, level: 'warning' });
        const childUpdate = getChildCourseUpdate(update);
        await childCourses.docs.map(async (courseDoc) => {
          await transaction.update(courseDoc.ref, childUpdate);
        });
      }

      // Now update the central course.
      await transaction.update(ref, filteredCourseItem);

      // Update the central tokens.
      await Promise.all(
        tokens.docs.map(tokenDoc => transaction.update(tokenDoc.ref, tokenUpdateFromCourse(update)))
      );
    });

    log({ message: 'Course successfully updated.', data, context });
    return { message: 'Course updated.', course: data };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Deletes a specific course AND all its items.
 * @param.uid - the id of the course to delete
 */
const deleteCourse = async (data, context) => {
  try {
    log({ message: 'Attempting to delete course...', data, context });
    checkAuth(context);

    // const { data: course, doc } = await _getCourse({ courseUid: data.uid, doCheck: false });
    // if (course.creatorUid !== context.auth.uid) throw new Error(`User ${context.auth.uid} did not create ${data.uid}.`);

    const { auth: { uid } } = context;

    const result = await admin.firestore().runTransaction(async (transaction) => {
      const { uid: courseUid } = data;

      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      const course = courseDoc.data();
      if (course.creatorUid !== uid) throw new Error(`User ${uid} did not create ${courseUid}.`);

      // Currently, the user can't delete a course that has children.
      const childrenRef = admin.firestore().collection('courses')
        .where('parent', '==', courseUid);
      const childrenDocs = await transaction.get(childrenRef);
      if (childrenDocs.size) throw new Error('Cannot delete a course that has already been purchased.');

      transaction.delete(courseRef);
    });

    // Done.
    log({ message: 'Successfully deleted course', data, context });
    return { message: `Course ${data.uid} deleted.` };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const onCourseUpdated = functions.firestore
  .document('/courses/{docId}')
  .onUpdate(async (change, context) => {
    const { docId } = context.params;
    log({ message: `Course ${docId} was updated.`, data: change.after.data(), context });

    // Update all tokens if necessary.
    const before = change.before.data();
    const after = change.after.data();
    const updateRequired = ['displayName', 'description', 'price'].find(key => before[key] !== after[key]);
    if (!updateRequired) {
      console.log('No update required.');
      return;
    }

    await admin.firestore().runTransaction((async (transaction) => {
      try {
        const { displayName, description, price, uid } = change.after.data();
        const tokensRef = admin.firestore()
          .collection('tokens')
          .where('courseUid', '==', uid)
          .select();

        const tokens = await transaction.get(tokensRef);
        const promises = tokens.docs.map((doc) => {
          return transaction.update(doc.ref, {
            displayName,
            description,
            price
          })
        });

        await Promise.all(promises).catch(error => {
          log({ message: error.message, data: error, context, level: 'error' });
        });
      } catch (error) {
        log({ message: error.message, data: change.after.data(), context, level: 'error' });
      }
    }));
  });

const onCourseDeleted = functions.firestore
  .document('/courses/{docId}')
  .onDelete(async (change, context) => {
    const { docId } = context.params;
    log({ message: `Course ${docId} was deleted.`, context });

    // Delete all tokens.
    const { uid } = change.data();

    const { streamingIds } = await admin.firestore().runTransaction(async (transaction) => {
      try {
        const tokensRef = admin.firestore()
          .collection('tokens')
          .where('courseUid', '==', uid)
        const tokens = await transaction.get(tokensRef);

        const itemsRef = admin.firestore()
          .collection('courses').doc(docId)
          .collection('items');
        const items = await transaction.get(itemsRef);

        // Delete tokens.
        const tokenPromises = tokens.docs.map((doc) => transaction.delete(doc.ref));

        // Delete items, saving streamingIds for the last step.
        const { promises: itemPromises, streamingIds } = items.docs.reduce((accum, doc) => {
          const item = doc.data();
          const newAccum = {
            promises: [...accum.promises, transaction.delete(doc.ref)],
            streamingIds: [...accum.streamingIds]
          };

          if (item.streamingId) newAccum.streamingIds.push(item.streamingId);

          return newAccum;
        }, { promises: [], streamingIds: [] });

        await Promise.all([...tokenPromises, itemPromises]).catch(error => {
          log({ message: error.message, data: error, context, level: 'error' });
        });
        log({ message: `Deleted ${tokenPromises.length} tokens and ${itemPromises.length} items.`, context });

        return { streamingIds };
      } catch (error) {
        log({ message: error.message, data: error, context, level: 'error' });
      }
    });

    // Now delete from streaming server.
    const promises = streamingIds.map(async (streamingId) => {
      const result = await fetch(
        `https://api.mux.com/video/v1/assets/${streamingId}`,
        {
          method: METHODS.DELETE,
          headers: getMuxHeaders()
        }
      );

      // TODO No way to know.
    });

    await Promise.all(promises).catch(error => {
      log({ message: error.message, data: error, context, level: 'error' });
    });
    log({ message: `Deleted ${promises.length} items from streaming server.`, context });
  });


module.exports = {
  // Courses
  // createCourse: functions.https.onCall(createCourse),
  createCourse2: functions.https.onCall(createCourse2),
  updateCourse: functions.https.onCall(updateCourse),
  // getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  initializePurchase: functions.https.onCall(initializePurchase),
  // updateCourse: functions.https.onCall(updateCourse),
  // giveCourse: functions.https.onCall(giveCourse),
  // getAllCourses: functions.https.onCall(getAllCourses),
  // getCreatedCourses: functions.https.onCall(getCreatedCourses),
  onCourseUpdated,
  onCourseDeleted,
  ...require('./users')
};
