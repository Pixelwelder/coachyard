const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { _createSchedulingUser, filterUserUpdate } = require('./utils');

// TODO Get this out of here.
const createSchedulingUser = async (data, context) => {
  const { auth: { uid } } = context;
  const doc = await admin.firestore().collection('users').doc(uid).get();
  const user = doc.data();
  await _createSchedulingUser(user);
};

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

/**
 * Allows a user to update their own user profile.
 *
 * @param data
 * @param context
 * @returns {Promise<void>}
 */
const updateOwnUser = async (data, context) => {
  try {
    log({ message: 'Getting user...', data, context });
    checkAuth(context);

    const { uid } = context.auth;
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update(filterUserUpdate(data));

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  getUser: functions.https.onCall(getUser),
  createSchedulingUser: functions.https.onCall(createSchedulingUser),
  updateOwnUser: functions.https.onCall(updateOwnUser),
  ...require('./handlers')
};
