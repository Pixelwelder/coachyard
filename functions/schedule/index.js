const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { deleteProvider, getProvider: _getProvider } = require('./providers');
const { deleteCustomer } = require('./customers');
const { getServices: _getServices } = require('./services');
const { checkAuth } = require('../util/auth');
const { log } = require('../logging');
const { schedule } = require('./webhooks');

// const scheduling_onCreateUser = functions.auth.user()
//   .onCreate(async (user, context) => {
//     const { uid, email } = user;
//     const password = generatePassword(20, true);
//     const providerResult = await addProvider({ uid, email, password });
//     const customerResult = await addCustomer({ uid, email });
//     // For the love of FSM change this as soon as possible.
//     try {
//       await admin.firestore().runTransaction(async (transaction) => {
//         console.log('scheduling transaction', uid);
//         const cachedProvider = { ...providerResult, settings: { ...providerResult.settings, password } }
//         const providerRef = admin.firestore().collection('easy_providers').doc(uid);
//         await transaction.set(providerRef, cachedProvider);
//
//         const customerRef = admin.firestore().collection('easy_customers').doc(uid);
//         await transaction.set(customerRef, customerResult);
//       })
//     } catch (error) {
//       console.log('-=====-')
//       console.log(error);
//       console.log('-=====-')
//     }
//   })

// TODO We can easily end up with orphaned providers and customers here.
// TODO Consider hanging stuff on user, in subcollections.
const schedulingOnDeleteUser = functions.auth.user()
  .onDelete(async (user) => {
    const { uid } = user;
    const providerDoc = await admin.firestore().collection('easy_providers').doc(uid).get();
    if (providerDoc.exists) {
      const { id: providerId } = providerDoc.data();
      await deleteProvider({ id: providerId });
      await providerDoc.ref.delete();
    }

    const customerDoc = await admin.firestore().collection('easy_customers').doc(uid).get();
    if (customerDoc.exists) {
      const { id: customerId } = customerDoc.data();
      await deleteCustomer(customerId);
      await customerDoc.ref.delete();
    }
  });

const getServices = functions.https.onCall(async (data, context) => {
  try {
    checkAuth(context);
    const services = await _getServices();
    return services;
  } catch (error) {
    log({
      message: error.message, data: error, context, level: 'error'
    });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

const getProvider = functions.https.onCall(async (data, context) => {
  try {
    checkAuth(context);

    const { auth: { uid } } = context;
    const providerDoc = await admin.firestore().collection('easy_providers').doc(uid).get();
    if (!providerDoc.exists) throw new Error(`No provider for user ${uid}.`);

    const { id } = providerDoc.data();
    const provider = await _getProvider({ id });
    return provider;
  } catch (error) {
    log({
      message: error.message, data: error, context, level: 'error'
    });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
});

module.exports = {
  schedulingOnDeleteUser,
  getServices,
  getProvider,
  schedule
};
