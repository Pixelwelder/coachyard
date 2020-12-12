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

  const courseData = Course({
    creator: uid,
    displayName
  });

  try {
    const result = await admin.firestore().collection('courses').doc().set(courseData);
    console.log('result', result);
  } catch (error) {
    console.log('error', error);
  }
  return { message: `Course ${displayName} created.`};
};

const getCourse = () => {};
const updateCourse = () => {};
const deleteCourse = () => {};

const getAllCourses = (data, context) => {
  checkAuth(context);

  const { auth: { token: { uid } } } = context;
};

module.exports = {
  createCourse: functions.https.onCall(createCourse),
  getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  updateCourse: functions.https.onCall(updateCourse),
  getAllCourses: functions.https.onCall(getAllCourses)
};
