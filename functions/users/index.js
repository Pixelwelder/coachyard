const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');

const newUserMeta = (overrides) => ({
  uid: '',
  created: '',
  updated: '',
  students: [],
  courses: [],
  ...overrides
});

/**
 * Creates a user but does not log them in.
 */
const createUser = async (data, context) => {
  try {
    const { email, password, roles, displayName } = data;

    // Create the user in the auth database.
    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      password,
      displayName
    });

    // Add custom user claims.
    const { uid } = userRecord;
    await admin.auth().setCustomUserClaims(uid, { roles });

    // Now create a user meta for additional information.
    const timestamp = admin.firestore.Timestamp.now();
    const userMeta = newUserMeta({
      uid,
      created: timestamp,
      updated: timestamp
    });

    // Use the same ID for both.
    const result = await admin.firestore().collection('users').doc(uid).set(userMeta);
    return { message: 'Done.', data: { uid } }
  } catch (error) {
    console.log('error', error.message)
    throw new functions.https.HttpsError('internal', error.message, error);
  }
  // const result2 = await admin.auth().setCustomUserClaims()
};

/**
 * Returns the metadata for the currently logged-in user.
 */
const getUserMeta = async (data, context) => {
  try {
    checkAuth(context);
    const { uid } = context.auth;
    const snapshot = await admin.firestore().collection('users').doc(uid).get();
    const data = snapshot.data();
    return data;
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message, error);
  }
}

// // This could be done with rules.
// const getStudents = async (data, context) => {
//   try {
//     checkAuth(context);
//     const { uid } = context.auth;
//     const teacher = await admin.firestore().collection('users').doc(uid).get();
//     const data = teacher.docs[0].data();
//
//     const snapshot = admin.firestore().collection('users')
//   } catch (error) {
//     console.log(error);
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
// }

module.exports = {
  createUser: functions.https.onCall(createUser),
  getUserMeta: functions.https.onCall(getUserMeta),
  // getStudents: functions.https.onCall(getStudents)
};
