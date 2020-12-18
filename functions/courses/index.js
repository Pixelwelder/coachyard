const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');
const { newCourse, newCourseItem } = require('../data');

const createCourse = async (data, context) => {
  try {
    checkAuth(context);

    const { auth: { token: { uid } } } = context;
    const { displayName, description } = data;

    // Create course object.
    const now = admin.firestore.Timestamp.now();
    const course = newCourse({
      creatorUid: uid,
      displayName,
      description,
      created: now,
      updated: now
    });

    // Add it everywhere it needs to be added.
    const { courseUid } = await admin.firestore().runTransaction(async (transaction) => {
      const teacherRef = admin.firestore().collection('users').doc(uid);
      const teacherDoc = await transaction.get(teacherRef);
      const teacherMeta = teacherDoc.data();
      console.log('teacher', uid, teacherDoc.exists);

      const courseRef = admin.firestore().collection('courses').doc();
      await transaction.create(courseRef, course);

      console.log('teacherMeta', teacherMeta);
      await transaction.update(teacherRef, { coursesCreated: [ ...teacherMeta.coursesCreated, courseRef.id ] });
      return { courseUid: courseRef.id }
    });

    return { message: `Course '${displayName}' created.`, courseUid };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

// const giveCourse = async (data, context) => {
//   try {
//     checkAuth(context);
//     const { auth: { token: { uid } } } = context;
//     const { courseUid, userUid } = context;
//
//     // Get the course.
//     const course = await admin.firestore().collection('courses').doc(courseUid).get();
//     if (!course.exists) throw new Error(`Course ${courseUid} does not exist.`);
//
//     // See if the giver has the right to give it.
//     if (course.creatorUid !== uid) throw new Error(`Course was not created by ${uid}.`);
//
//     const gifteeDoc = await admin.firestore().collection('users').doc(userUid).get();
//     if (!gifteeDoc.exists) throw new Error(`No user by uid ${userUid}.`);
//
//     const giftee = gifteeDoc.data();
//     if (giftee.courses.find(_courseUid => _courseUid === courseUid))
//       throw new Error(`User already owns course ${userUid}.`);
//
//     await admin.firestore().collection('users').doc(userUid)
//       .update({ courses: [ ...giftee.courses, courseUid ]});
//
//     return { message: `User ${userUid} now owns course ${courseUid}.`};
//
//   } catch (error) {
//     console.error(error);
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
// };

/**
 * Utility function - asynchronously loads a user meta.
 * @private
 * @param uid
 */
const _getUserMeta = async ({ uid }) => {
  const doc = await admin.firestore().collection('users').doc(uid).get();
  if (!doc.exists) throw new Error(`No user by uid ${uid}.`);

  return { doc, data: doc.data() };
};

/**
 * Utility function - tells us whether a user is cleared to load a course.
 * @private
 * @param userMeta
 * @param courseUid
 */
const _canGetCourse = ({ userMeta, courseUid }) => {
  return !![...userMeta.coursesCreated, ...userMeta.coursesEnrolled]
    .find(_courseUid => _courseUid === courseUid);
};

/**
 * Utility function - asynchronously loads a course.
 * @private
 * @param userMeta - the user meta of the user who wishes to load the course
 * @param courseUid - the id of the course to load
 * @param doCheck - whether we should check if the user is allowed
 */
const _getCourse = async ({ userMeta, courseUid, doCheck = true }) => {
  console.log('_getCourse', courseUid);
  if (doCheck) {
    if (!_canGetCourse({ userMeta, courseUid })) throw new Error(`User ${userMeta.uid} cannot get course ${courseUid}`)
  }

  const doc = await admin.firestore().collection('courses').doc(courseUid).get();
  if (!doc.exists) throw new Error(`Course ${courseUid} does not exist.`);

  return { doc, data: doc.data() };
};

/**
 * Gets a specific course.
 * @param.uid - the id of the course to return
 */
const getCourse = async (data, context) => {
  try {
    checkAuth(context);

    console.log('----', data);

    const { data: userMeta } = await _getUserMeta({ uid: context.auth.uid });
    const { data: course } = await _getCourse({ userMeta, courseUid: data.uid });

    return course;
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Deletes a specific course.
 * @param.uid - the id of the course to delete
 */
const deleteCourse = async (data, context) => {
  try {
    checkAuth(context);

    const { data: course, doc } = await _getCourse({ courseUid: data.uid, doCheck: false });
    if (course.creatorUid !== context.auth.uid) throw new Error(`User ${context.auth.uid} did not create ${data.uid}.`);

    const result = admin.firestore().runTransaction((transaction) => {

    });

    // Delete the document itself.
    await doc.ref.delete();

    // Now remove it from the user.
    const { doc: userDoc, data: { coursesCreated } } = await _getUserMeta({ uid: context.auth.uid });
    const filteredCourses = coursesCreated.filter(courseUid => courseUid !== data.uid);
    await userDoc.ref.update({ coursesCreated: filteredCourses, updated: admin.firestore.Timestamp.now() });

    // Done.
    return { message: `Course ${data.uid} deleted.` };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const addItemToCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { courseUid, newItem: { displayName, description } } = data;

    console.log('addItemToCourse', data);
    const result = admin.firestore().runTransaction(async (transaction) => {

      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) throw new Error(`No course by uid ${courseUid}.`)

      const course = courseDoc.data();
      if (course.creatorUid !== uid) throw new Error('Only the creator of a course can add an item.');

      const timestamp = admin.firestore.Timestamp.now();
      const item = newCourseItem({
        displayName,
        description,
        created: timestamp,
        updated: timestamp
      });

      // Add it to the items table.
      // const itemRef = admin.firestore().collection('items').doc();
      // await transaction.create(itemRef, item);

      // Now update course.
      await transaction.update(courseRef, { items: [ ...course.items, item ]});
    });

    return { message: `Added new course item to course ${courseUid}.` };
  } catch (error) {
    console.error(error);
  }
};

/**
 * Deletes an item from a course.
 * Requires that the caller be the creator of the course.
 *
 * @param courseUid
 * @param index
 */
const deleteItemFromCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { courseUid, index } = data;

    const result = admin.firestore().runTransaction(async (transaction) => {
      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      const course = courseDoc.data();

      // Can the user do this?
      if (!course.creatorUid === uid) throw new Error(`User ${uid} did not create ${courseUid}.`);

      // const userRef = admin.firestore().collection('users').doc(uid);
      // const userDoc = await transaction.get(userRef);
      // const user = userDoc.data();

      const newItems = [...course.items];
      newItems.splice(index, 1);
      await transaction.update(courseRef, { items: newItems });
    });

    return { message: 'Item removed.' };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const updateCourse = () => {};
// const deleteCourse = () => {};

const getAllCourses = (data, context) => {
  checkAuth(context);
  // TODO This is admin only.

  const { auth: { token: { uid } } } = context;
};

/**
 * Gets the courses created by the signed-in user.
 */
const getCreatedCourses = async (data, context) => {
  checkAuth(context);

  const { auth: { token: { uid } } } = context;
  const snapshot = await admin.firestore()
    .collection('courses').where('creator', '==', uid)
    .get();

  const courses = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));

  console.log(courses.length, 'found');
  return courses;
};

module.exports = {
  // Courses
  createCourse: functions.https.onCall(createCourse),
  getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  // updateCourse: functions.https.onCall(updateCourse),
  // giveCourse: functions.https.onCall(giveCourse),

  // Items
  addItemToCourse: functions.https.onCall(addItemToCourse),
  deleteItemFromCourse: functions.https.onCall(deleteItemFromCourse),

  getAllCourses: functions.https.onCall(getAllCourses),
  getCreatedCourses: functions.https.onCall(getCreatedCourses)
};
