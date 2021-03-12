const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jdenticon = require('jdenticon');
const { v4: uuid } = require('uuid');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { newUserMeta, newStripeCustomer } = require('../data');
const { setClaims } = require('../util/claims');
const { toKebab } = require('../util/string');
const stripe = require('../billing/stripe');
const generatePassword = require('password-generator');
const { addProvider } = require('../schedule/providers');
const { addCustomer } = require('../schedule/customers');

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

const _createStripeCustomer = async (user, timestamp) => {
  // Create billing for user.
  const stripeCustomer = await stripe.customers.create({
    name: user.displayName,
    email: user.email,
    metadata: { uid: user.uid }
  });
  // TODO Do we actually want to do this?
  const stripeIntent = await stripe.setupIntents.create({ customer: stripeCustomer.id });

  const fbCustomer = newStripeCustomer({
    uid: user.uid,
    created: timestamp,
    updated: timestamp,
    customer_id: stripeCustomer.id,
    setup_secret: stripeIntent.client_secret
  });

  return fbCustomer;
}

const _createUserMeta = ({ uid, email, displayName }, timestamp, slug) => ({
  uid,
  email,
  displayName,
  description: `${displayName} is a coach with a passion for all things coaching.`,
  slug,
  created: timestamp,
  updated: timestamp
});

const _createSchedulingUser = async ({ uid, email }, password) => {
  const schedulingProvider = await addProvider({ uid, email, password });
  const schedulingCustomer = await addCustomer({ uid, email });

  return { schedulingProvider, schedulingCustomer };
};

/**
 * Performs some maintenance when users are created.
 */
const users_onCreateUser = functions.auth.user()
  .onCreate(async (_user, context) => {
    const user = await admin.auth().getUser(_user.uid);
    log({ message: 'User was created.', data: user, context });
    const timestamp = admin.firestore.Timestamp.now();
    const { uid, email, displayName } = user;

    const billingCustomer = await _createStripeCustomer(user, timestamp);
    const password = generatePassword(20, false);
    const { schedulingProvider, schedulingCustomer } = await _createSchedulingUser(user, password);

    // Create user meta.
    await admin.firestore().runTransaction(async (transaction) => {
      // Create the slug.
      let slug = toKebab(displayName);
      const existingRef = admin.firestore()
        .collection('users')
        .where('slug', '==', slug);
      const existingDocs = await transaction.get(existingRef);
      if (existingDocs.size) slug = `${slug}-${existingDocs.size}`;
      const userMeta = _createUserMeta(user, timestamp, slug);

      // Add items to database.
      const metaRef = admin.firestore().collection('users').doc(uid);
      await transaction.set(metaRef, userMeta);

      const billingCustomerRef = admin.firestore().collection('stripe_customers').doc(user.uid);
      await transaction.set(billingCustomerRef, billingCustomer);

      // For the love of FSM change this as soon as possible.
      const cachedProvider = { ...schedulingProvider, settings: { ...schedulingProvider.settings, password } }
      const providerRef = admin.firestore().collection('easy_providers').doc(uid);
      await transaction.set(providerRef, cachedProvider);

      const schedulingCustomerRef = admin.firestore().collection('easy_customers').doc(uid);
      await transaction.set(schedulingCustomerRef, schedulingCustomer);
    });

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
