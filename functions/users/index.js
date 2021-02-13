const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jdenticon = require('jdenticon');
const { v4: uuid } = require('uuid');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { newUserMeta } = require('../data');
const { setClaims } = require('../util/claims');

const _createIcon = async ({ uid }) => {
  // Create icon.
  const png = jdenticon.toPng(uid, 200);
  const buffer = Buffer.from(png);

  await admin.storage().bucket().file(`avatars/${uid}.png`).save(buffer, {
    metadata: {
      fileType: 'image/png',
      metadata: {
        // Allows us to see the image in Firebase Admin UI
        firebaseStorageDownloadTokens: uuid(),
        cacheControl: 'public,max-age=4000'
      }
    }
  });

  await admin.firestore().collection('users').doc(uid).update({ image: `${uid}.png`});
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
const users_onCreateUser = functions.auth.user()
  .onCreate(async (user, context) => {
    log({ message: 'User was created.', data: user, context });
    const { uid, email } = user;

    // Create icon.
    await _createIcon({ uid });

    // Create claims.
    await setClaims({ uid, claims: { tier: 0, subscribed: false, remaining: 0 } });

    // await admin.firestore().runTransaction(async (transaction) => {
    //   // Update all tokens that mention this user.
    //   const tokensRef = admin.firestore()
    //     .collection('tokens')
    //     .where('user', '==', email)
    //     .select();
    //
    //   // Update tokens that should belong to this user.
    //   const result = await transaction.get(tokensRef);
    //   log({ message: `Found ${result.size} tokens referring to this new user.`, data: user, context });
    //   const promises = result.docs.map((doc) => {
    //     return transaction.update(doc.ref, { user: uid });
    //   })
    //
    //   await Promise.all(promises).catch(error => {
    //     log({ message: error.message, data: error, context, level: 'error' });
    //   });
    // })
  });

const users_onDeleteUser = functions.auth.user()
  .onDelete(async (user, context) => {
    const { uid } = user;
    await admin.firestore().collection('users').doc(uid).delete();
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

const users_onCreateUserMeta = functions.firestore
  .document('/users/{docId}')
  .onCreate(async (change, context) => {
    const user = change.data();
    const { uid, email, displayName } = user;

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
        return transaction.update(doc.ref, { user: uid, userDisplayName: displayName });
      })

      await Promise.all(promises).catch(error => {
        log({ message: error.message, data: error, context, level: 'error' });
      });
    })
  });

module.exports = {
  // createUser: functions.https.onCall(createUser),
  getUser: functions.https.onCall(getUser),
  updateUserToCurrent: functions.https.onCall(updateUserToCurrent),
  users_onCreateUser,
  users_onDeleteUser,
  users_onCreateUserMeta,
  // onUpdateUserMeta
};
