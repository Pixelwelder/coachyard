const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');
const { newCourse, newCourseItem } = require('../data');

const createCourse = async (data, context) => {
  try {
    checkAuth(context);
    console.log(data);

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

const giveCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { token: { uid } } } = context;
    const { courseUid, userUid } = context;

    // Get the course.
    const course = await admin.firestore().collection('courses').doc(courseUid).get();
    if (!course.exists) throw new Error(`Course ${courseUid} does not exist.`);

    // See if the giver has the right to give it.
    if (course.creatorUid !== uid) throw new Error(`Course was not created by ${uid}.`);

    const gifteeDoc = await admin.firestore().collection('users').doc(userUid).get();
    if (!gifteeDoc.exists) throw new Error(`No user by uid ${userUid}.`);

    const giftee = gifteeDoc.data();
    if (giftee.courses.find(_courseUid => _courseUid === courseUid))
      throw new Error(`User already owns course ${userUid}.`);

    await admin.firestore().collection('users').doc(userUid)
      .update({ courses: [ ...giftee.courses, courseUid ]});

    return { message: `User ${userUid} now owns course ${courseUid}.`};

  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Gets a specific course.
 * @param.id - the id of the course to return
 */
const getCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: courseUid } = data;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userMeta = userDoc.data();
    const canGet = !![...userMeta.coursesCreated, ...userMeta.coursesEnrolled]
      .find(_courseUid => _courseUid === _courseUid);

    console.log(userMeta.coursesCreated, userMeta.coursesEnrolled, courseUid)
    if (!canGet) throw new Error(`User ${uid} is not able to get course ${courseUid}.`);

    const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
    if (!courseDoc.exists) throw new Error(`Course ${uid} does not exist.`);

    return courseDoc.data();

  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const addItemToCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    // TODO Can this person add it?

    console.log(data);
    const { courseUid, newItem: { displayName, description } } = data;
    const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
    if (!courseDoc.exists) throw new Error(`No course by uid ${courseUid}.`)

    const course = courseDoc.data();

    const courseItem = newCourseItem({ displayName, description });
    await admin.firestore().collection('courses').doc(courseUid)
      .update({ items: [ ...course.items, courseItem ] });

    return { message: `Added new course item to course ${courseUid}.` };
  } catch (error) {
    console.error(error);
  }
};

const updateCourse = () => {};
const deleteCourse = () => {};

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
  giveCourse: functions.https.onCall(giveCourse),

  getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  updateCourse: functions.https.onCall(updateCourse),
  getAllCourses: functions.https.onCall(getAllCourses),
  getCreatedCourses: functions.https.onCall(getCreatedCourses)
};
