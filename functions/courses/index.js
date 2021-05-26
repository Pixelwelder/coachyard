const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { tokenUpdateFromCourse, tokenFromCourse2, getChildCourseUpdate, filterCourseItem } = require('./utils');
const { newCourse, newCourseItem, newCourseToken } = require('../data');
const { uploadImage } = require('./images');

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
        tokens.docs.map(tokenDoc => {
          const tokenUpdate = tokenUpdateFromCourse(update);
          delete tokenUpdate.type; // Don't want to overwrite.
          return transaction.update(tokenDoc.ref, tokenUpdate)
        })
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

module.exports = {
  // Courses
  createCourse2: functions.https.onCall(createCourse2),
  updateCourse: functions.https.onCall(updateCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  ...require('./users'),
  ...require('./handlers')
};
