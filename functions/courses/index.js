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

const _getUserMeta = async ({ uid }) => {
  const doc = await admin.firestore().collection('users').doc(uid).get();
  if (!doc.exists) throw new Error(`No user by uid ${uid}.`);

  return { doc, data: doc.data() };
};

const _canGetCourse = ({ userMeta, courseUid }) => {
  return !![...userMeta.coursesCreated, ...userMeta.coursesEnrolled]
    .find(_courseUid => _courseUid === courseUid);
};

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

    console.log('--- DELETE_COURSE ---', data);
    const { data: course, doc } = await _getCourse({ courseUid: data.uid, doCheck: false });
    if (course.creatorUid !== context.auth.uid) throw new Error(`User ${context.auth.uid} did not create ${data.uid}.`);

    await doc.ref.delete();

    // Now remove it from the user.
    const { doc: userDoc, data: { coursesCreated } } = await _getUserMeta({ uid: context.auth.uid });
    const filteredCourses = coursesCreated.filter(courseUid => courseUid !== data.uid);
    console.log('filtered courses', filteredCourses)
    await userDoc.ref.update({ coursesCreated: filteredCourses, updated: admin.firestore.Timestamp.now() });

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

    console.log(data);
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
      const itemRef = admin.firestore().collection('items').doc();
      await transaction.create(itemRef, item);

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
 * @param itemUid
 * @param courseUid
 */
const deleteItem = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { itemUid, courseUid } = data;

    // Can this user do this?
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userMeta = userDoc.data();
    const canExecute = !!userMeta.coursesCreated.find(course => course.creatorUid === uid);
    if (!canExecute) throw new Error(`Course ${courseUid} is not owned by user ${uid}.`);

    const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
    const course = courseDoc.data();
    // const newItems = course.items.filter(item => item)


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
  createCourse: functions.https.onCall(createCourse),
  addItemToCourse: functions.https.onCall(addItemToCourse),
  // giveCourse: functions.https.onCall(giveCourse),

  getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  updateCourse: functions.https.onCall(updateCourse),
  getAllCourses: functions.https.onCall(getAllCourses),
  getCreatedCourses: functions.https.onCall(getCreatedCourses)
};
