const admin = require('firebase-admin');
const jdenticon = require('jdenticon');
const { log } = require('../logging');
const { v4: uuid } = require('uuid');
const { newUserMeta, newStripeCustomer } = require('../data');
const generatePassword = require('password-generator');
const stripe = require('../billing/stripe');
const { addProvider } = require('../schedule/providers');
const { addCustomer } = require('../schedule/customers');

const createIcon = async ({ uid }) => {
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
const convert = ({ item, factoryFunc }) => {
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
const updateMeta = async ({ uid }) => {
  const result = await admin.firestore().runTransaction(async (transaction) => {
    const ref = admin.firestore().collection('users').doc(uid);
    const doc = await transaction.get(ref);

    if (doc.exists) {
      const newItem = convert({ item: doc.data(), factoryFunc: newUserMeta });
      await transaction.set(ref, newItem);
    }
  });
};

const createStripeCustomer = async (user, timestamp) => {
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

const createUserMeta = ({ uid, email, displayName }, timestamp, slug) => ({
  uid,
  email,
  displayName,
  description: `${displayName} is a coach with a passion for all things coaching.`,
  slug,
  created: timestamp,
  updated: timestamp
});

const _createSchedulingUser = async ({ uid, email }) => {
  let schedulingProvider = null;
  let schedulingCustomer = null;

  try {
    const password = generatePassword(20, false);
    schedulingProvider = await addProvider({ uid, email, password });
    schedulingCustomer = await addCustomer({ uid, email });

    // For the love of FSM change this as soon as possible.
    console.log('add scheduling provider', schedulingProvider.settings.workingPlan)
    const cachedProvider = { ...schedulingProvider, uid, settings: { ...schedulingProvider.settings, password } };
    const providerRef = admin.firestore().collection('easy_providers').doc(uid);
    await providerRef.set(cachedProvider);
    console.log('add scheduling user complete')

    console.log('add scheduling customer');
    const cachedSchedulingCustomer = { ...schedulingCustomer, uid };
    const schedulingCustomerRef = admin.firestore().collection('easy_customers').doc(uid);
    await schedulingCustomerRef.set(cachedSchedulingCustomer);
    console.log('add scheduling customer complete')

  } catch (error) {
    log({ message: error.message, data: error, context: { uid, email }, level: 'warning' });
  }
};

/**
 * Filters a user update so a user can't just add arbitrary fields.
 *
 * @returns the filtered update
 */
const filterUserUpdate = ({ description }) => ({
  description
});

module.exports = {
  convert,
  createIcon,
  updateMeta,
  createUserMeta,
  createStripeCustomer,
  _createSchedulingUser,
  filterUserUpdate
};
