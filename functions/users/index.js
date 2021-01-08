const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { newStudent, newUserMeta } = require('../data');

/**
 * Creates a user but does not log them in.
 */
// const createUser = async (data, context) => {
//   try {
//     log({ message: 'Attempting to create user...', data, context });
//
//     const { email: _email, password, roles, displayName } = data;
//     const email = _email.toLowerCase();
//
//     // Create the user in the auth database.
//     const userRecord = await admin.auth().createUser({
//       email,
//       emailVerified: false,
//       password,
//       displayName
//     });
//
//     // Add custom user claims.
//     const { uid } = userRecord;
//     await admin.auth().setCustomUserClaims(uid, { roles });
//
//     const result = admin.firestore().runTransaction(async (transaction) => {
//       // Now we need a user meta for additional information.
//       const timestamp = admin.firestore.Timestamp.now();
//       const userMeta = newUserMeta({
//         uid,
//         displayName,
//         created: timestamp,
//         updated: timestamp
//       });
//
//       // Use the same ID for the user meta.
//       await admin.firestore().collection('users').doc(uid).set(userMeta);
//     });
//
//     return { message: 'Done.', data: { uid } }
//   } catch (error) {
//     console.log('error', error.message)
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
//   // const result2 = await admin.auth().setCustomUserClaims()
// };

/**
 * Performs some maintenance when users are created.
 */
const onCreateUser = functions.auth.user().onCreate(async (user, context) => {
  log({ message: 'User was created.', data: user, context });
  const { uid, email } = user;
  // const doc = admin.firestore().collection('users').doc(uid);
  // const timestamp = admin.firestore.Timestamp.now();
  // const userMeta = newUserMeta({
  //   uid,
  //   created: timestamp,
  //   updated: timestamp
  // });
  // const result = await doc.set(userMeta);

  // Load all items that mention this student and change email to uid.
  const itemsResult = await admin.firestore().runTransaction(async (transaction) => {
    const tokensRef = admin.firestore()
      .collection('tokens')
      .where('user', '==', email)
      .select();

    const result = await transaction.get(tokensRef);
    log({ message: `Found ${result.size} tokens referring to this new user.`, data: user, context });
    const promises = result.docs.map((doc) => {
      return transaction.update(doc.ref, { user: uid });
    })

    await Promise.all(promises).catch(error => {
      log({ message: error.message, data: error, context, level: 'error' });
    });
  })
});

/**
 * Returns the metadata for the currently logged-in user.
 * TODO Remove this.
 */
const getUser = async (data, context) => {
  try {
    log({ message: 'Getting user...', data, context });
    checkAuth(context);
    const { uid } = context.auth;
    const snapshot = await admin.firestore().collection('users').doc(uid).get();
    const userMeta = snapshot.data();

    // if (!userMeta) throw new Error(`No user meta for user ${uid}.`)
    return userMeta;
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  // createUser: functions.https.onCall(createUser),
  getUser: functions.https.onCall(getUser),
  // createStudent: functions.https.onCall(createStudent),
  onCreateUser
};
