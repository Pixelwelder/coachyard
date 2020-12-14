const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');

// Create user - POST
// Get user - GET
// Delete user - DELETE
// Get all users - GET

const ROLES = {
  STUDENT: 1,
  TEACHER: 2
};

const newUserMeta = (overrides) => ({
  uid: '',
  created: '',
  updated: '',
  ...overrides
});

/**
 * Creates a user but does not log them in.
 */
const createUser = async (data, context) => {
  try {
    const { email, password, roles, displayName } = data;

    // Create the user in the auth database.
    console.log('Creating user', displayName, email, roles);
    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      password,
      displayName
    });

    // Add custom user claims.
    const { uid } = userRecord;
    console.log('created user', uid);
    await admin.auth().setCustomUserClaims(uid, { roles });
    console.log('added roles', roles);

    // Now create a user meta for additional information.
    const timestamp = admin.firestore.Timestamp.now();
    const userMeta = newUserMeta({
      uid,
      created: timestamp,
      updated: timestamp
    });

    // Use the same ID for both.
    console.log('adding user meta for', uid);
    const result = await admin.firestore().collection('users').doc(uid).set(userMeta);
    console.log('Added meta object to firestore.');
    return { message: 'Done.' }
  } catch (error) {
    console.log('error', error.message)
    throw new functions.https.HttpsError('internal', error.message, error);
  }
  // const result2 = await admin.auth().setCustomUserClaims()
};

// Updates user meta to new version.
const upgradeUserMeta = () => {};

const onCreateUser = (authUser) => {
  // Create a matching entry in the database.
  console.log('USER CREATED');
  // const user = newUser({});
  // const user = admin.firestore()
}

const onDeleteUser = (user) => {

};

const getUser = (data, context) => {};

module.exports = {
  createUser: functions.https.onCall(createUser),
  onCreateUser: functions.auth.user().onCreate(onCreateUser),
  onDeleteUser: functions.auth.user().onDelete(onDeleteUser)
}
