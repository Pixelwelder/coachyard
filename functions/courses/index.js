const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');

const Course = (overrides) => ({
  displayName: 'New Course',
  creator: 'Creator',
  content: [],
  ...overrides
});

const createCourse = async (data, context) => {
  checkAuth(context);

  const { auth: { token: { uid } } } = context;
  const { course } = data;
  const { displayName } = course;

  // Create course object.
  const now = admin.firestore.Timestamp.now();
  const courseData = Course({
    creator: uid,
    createdAt: now,
    updatedAt: now,
    displayName,
  });

  // Write to database.
  const doc = admin.firestore().collection('courses').doc();
  try {
    const result = await doc.set(data);
    console.log('result', result);
  } catch (error) {
    console.log('error', error);
    throw error;
  }

  return { message: `Course '${displayName}' created: ${doc.id}`};
};

/**
 * Gets a specific course.
 * @param.id - the id of the course to return
 */
const getCourse = (data, context) => {
  checkAuth(context);
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
  getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  updateCourse: functions.https.onCall(updateCourse),
  getAllCourses: functions.https.onCall(getAllCourses),
  getCreatedCourses: functions.https.onCall(getCreatedCourses)
};
