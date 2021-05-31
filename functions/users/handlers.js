const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { log } = require('../logging');
const { toKebab } = require('../util/string');
const { setClaims } = require('../util/claims');
const { uploadImage } = require('../util/images');
const { createIcon, _createSchedulingUser, createStripeCustomer, createUserMeta } = require('./utils');

/**
 * Performs some maintenance when users are created.
 */
const usersOnCreateUser = functions.auth.user()
  .onCreate(async (_user, context) => {
    const user = await admin.auth().getUser(_user.uid);
    log({ message: 'User was created.', data: user, context });
    const timestamp = admin.firestore.Timestamp.now();
    const { uid, email, displayName } = user;

    console.log('add billing customer')
    const billingCustomer = await createStripeCustomer(user, timestamp);
    const billingCustomerRef = admin.firestore().collection('stripe_customers').doc(user.uid);
    await billingCustomerRef.set(billingCustomer);
    console.log('add billing customer complete')

    try {
      await _createSchedulingUser(user);
    } catch (error) {
      console.warn(error);
    }

    // Create user meta.
    await admin.firestore().runTransaction(async (transaction) => {
      // Create the slug.
      let slug = toKebab(displayName);
      const existingRef = admin.firestore()
        .collection('users')
        .where('slug', '==', slug);
      const existingDocs = await transaction.get(existingRef);
      if (existingDocs.size) slug = `${slug}-${existingDocs.size}`;
      const userMeta = createUserMeta(user, timestamp, slug);

      // Add items to database.
      console.log('add user')
      const metaRef = admin.firestore().collection('users').doc(uid);
      await transaction.set(metaRef, userMeta);
      console.log('add user complete')
    });

    // Create icon.
    console.log('create icon');
    await createIcon({ uid });
    console.log('create icon complete');

    // Create banner image.
    await uploadImage({
      path: './users/images/coach-banner.jpg',
      destination: `banners/${uid}`,
      type: 'jpg'
    });

    // Create claims.
    console.log('set claims');
    await setClaims({ uid, claims: { tier: 0, subscribed: false, remaining: 0 } });
    console.log('set claims complete');

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

const usersOnDeleteUser = functions.auth.user()
  .onDelete(async (user, context) => {
    const { uid } = user;
    await admin.firestore().collection('users').doc(uid).delete();
  });

const usersOnCreateUserMeta = functions.firestore
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
  usersOnCreateUser,
  usersOnDeleteUser,
  usersOnCreateUserMeta
};
