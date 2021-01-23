const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jdenticon = require('jdenticon');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { newUserMeta } = require('../data');

const isProduction = process.env.FUNCTIONS_EMULATOR === "true";

const _createIcon = async ({ uid }) => {
  // Create icon.
  const png = jdenticon.toPng(uid, 200);
  const pathRoot = isProduction ? './' : '/temp/'
  const path = `${pathRoot}${uid}.png`;
  fs.writeFileSync(path, png);

  await admin.storage().bucket().upload(path, {
    destination: `avatars/${uid}.png`,
    metadata: {
      fileType: 'image/png',
      metadata: {
        firebaseStorageDownloadTokens: uuid()
      }
    }
  });

  await admin.firestore().collection('users').doc(uid).update({ image: `${uid}.png`});

  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Converts a data object to a new schema.
 * @param item
 * @param factoryFunc
 */
const _convert = ({ item, factoryFunc }) => {
  const template = factoryFunc();
  const newItem = Object.keys(template).reduce((accum, key) => {
    const newAccum = { ...accum };
    if (item.hasOwnProperty(key)) newAccum[key] = item[key];
    return newAccum;
  }, template);

  return newItem;
};

/**
 * Updates a user object to the current schema plus adds an image.
 * @param uid
 */
const _updateMeta = async ({ uid }) => {
  const result = await admin.firestore().runTransaction(async (transaction) => {
    const ref = admin.firestore().collection('users').doc(uid);
    const doc = await transaction.get(ref);

    if (doc.exists) {
      const newItem = _convert({ item: doc.data(), factoryFunc: newUserMeta });
      await transaction.set(ref, newItem);
    }
  });
};

const updateUserToCurrent = async (data, context) => {
  try {
    log({ message: 'Updating user meta to current schema.', data, context });
    const { auth: { uid } } = context;
    await _createIcon({ uid });
    await _updateMeta({ uid });
    log({ message: 'User meta updated.', data, context });
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Performs some maintenance when users are created.
 */
const onCreateUser = functions.auth.user().onCreate(async (user, context) => {
  log({ message: 'User was created.', data: user, context });
  const { uid, email } = user;

  // Create icon.
 await _createIcon({ uid });

  await admin.firestore().runTransaction(async (transaction) => {
    // Update all tokens that mention this user.
    const tokensRef = admin.firestore()
      .collection('tokens')
      .where('user', '==', email)
      .select();

    // Update tokens that should belong to this user.
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
  updateUserToCurrent: functions.https.onCall(updateUserToCurrent),
  onCreateUser
};
