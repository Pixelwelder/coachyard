const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { tokenFromCourse2 } = require('./utils');

const addUser = async (data, context) => {
  try {
    checkAuth(context);
    const { courseUid, studentEmail } = data;
    console.log(data);

    await admin.firestore().runTransaction(async (transaction) => {
      // Grab the course.
      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);
      const course = courseDoc.data();
      const { displayName, image, creatorUid } = course;

      // Grab the student.
      const studentRef = admin.firestore()
        .collection('users')
        .where('email', '==', studentEmail)
        .limit(1);
      const studentDocs = await transaction.get(studentRef);
      const student = studentDocs.size
        ? studentDocs.docs[0].data()
        : { uid: studentEmail, displayName: studentEmail };

      // Check to make sure token doesn't already exist.
      const existingTokenRef = admin.firestore().collection('tokens')
        .where('courseUid', '==', courseUid)
        .where('user', '==', student.uid)
        .limit(1);
      const existingTokenDoc = await transaction.get(existingTokenRef);
      if (existingTokenDoc.size) throw new Error(`User ${studentEmail} already has access to ${courseUid}.`);

      const { data, ref } = tokenFromCourse2(course, student);
      await transaction.set(ref, data);
    });

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const removeUser = async (data, context) => {
  try {
    checkAuth(context);
    const { tokenUid } = data;
    const result = await admin.firestore().runTransaction(async (transaction) => {

      const tokenRef = admin.firestore().collection('tokens').doc(tokenUid);
      const tokenDoc = await transaction.get(tokenRef);
      if (!tokenDoc.exists) throw new Error(`Token ${tokenUid} does not exist.`);

      await transaction.delete(tokenRef);
    });
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  addUser: functions.https.onCall(addUser),
  removeUser: functions.https.onCall(removeUser),
};
