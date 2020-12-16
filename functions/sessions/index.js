const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { checkAuth } = require('../util/auth');

const newSession = (overrides) => ({
  created: '',
  updated: '',
  date: '',
  displayName: '',
  teacherUid: '',
  studentEmail: '', // Since we don't know if they've joined yet.
  ...overrides
});

const processData = (snapshot) => snapshot.docs.map(({ id, data }) => ({ data: data(), id }));

/**
 * Gets all the sessions that a student is associated with.
 */
const getSessionsStudent = async (data, context) => {
  try {
    checkAuth(context);

    const { uid } = context.auth;
    const snapshot = await admin.firestore()
      .collection('sessions')
      .where('student', '==', uid)
      .get();

    const sessions = processData(snapshot);
    return { data: sessions };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Gets all the sessions that a teacher is associated with.
 */
const getSessionsTeacher = (data, context) => {
  checkAuth(context)

  const { uid } = context.auth;
};

const createSession = async (data, context) => {
  try {
    checkAuth(context);

    const { uid, date, displayName, student } = context.auth;
    const snapshot = await admin.firestore().collection('students').doc(student).get();
    if (!snapshot.docs.length) {
      throw new Error(`No such student: ${student}.`)
    }

    const timestamp = admin.firestore.Timestamp.now();
    const session = newSession({
      teacher: uid,
      student,
      date,
      displayName,
      created: timestamp,
      updated: timestamp
    });
    const result = await admin.firestore().collection('sessions').doc().set(session);

  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const updateSession = (data, context) => {};
const deleteSession = (data, context) => {};

module.exports = {
  getSessionsStudent: functions.https.onCall(getSessionsStudent),
  getSessionsTeacher: functions.https.onCall(getSessionsTeacher),
  createSession: functions.https.onCall(createSession),
  updateSession: functions.https.onCall(updateSession),
  deleteSession: functions.https.onCall(deleteSession)
};
