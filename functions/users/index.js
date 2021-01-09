const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { newStudent, newUserMeta } = require('../data');

/**
 * Performs some maintenance when users are created.
 */
const onCreateUser = functions.auth.user().onCreate(async (user, context) => {
  log({ message: 'User was created.', data: user, context });
  const { uid, email } = user;

  console.log('+++', uid, email);
  await admin.firestore().runTransaction(async (transaction) => {
    // Update all tokens that mention this user.
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

    // Create user meta.
    const metaRef = admin.firestore().collection('users').doc(uid);
    const timestamp = admin.firestore.Timestamp.now();
    const meta = newUserMeta({
      uid,
      created: timestamp,
      updated: timestamp
    });
    await transaction.create(metaRef, meta);
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
