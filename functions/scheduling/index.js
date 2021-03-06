const functions = require('firebase-functions');
const admin = require('firebase-admin');
const generatePassword = require('password-generator');
const { addProvider, deleteProvider, updateProvider } = require('./providers');
const { addCustomer, deleteCustomer, updateCustomer } = require('./customers');

const scheduling_onCreateUser = functions.auth.user()
  .onCreate(async (user, context) => {
    const { uid, email } = user;
    const password = generatePassword(20, true);
    const providerResult = await addProvider({ uid, email, password });
    // For the love of FSM change this as soon as possible.
    const cachedProvider = { ...providerResult, settings: { ...providerResult.settings, password } }
    await admin.firestore().collection('easy_providers').doc(uid).set(cachedProvider);

    const customerResult = await addCustomer({ uid, email });
    console.log('customer', customerResult);
    await admin.firestore().collection('easy_customers').doc(uid).set(customerResult);
  })

// TODO We can easily end up with orphaned providers and customers here.
const scheduling_onDeleteUser = functions.auth.user()
  .onDelete(async (user, context) => {
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

const scheduling_onUpdateUser = functions.firestore
  .document('/users/{docId}')
  .onUpdate(async (change, context) => {
    const { params: { docId: uid } } = context;
    const { displayName } = change.after.data();

    const providerDoc = await admin.firestore().collection('easy_providers').doc(uid).get();
    if (providerDoc.exists) {
      const { id, settings } = providerDoc.data()
      const result = await updateProvider({ id, data: { firstName: displayName, lastName: '', settings } });
      console.log(result);
    }

    const customerDoc = await admin.firestore().collection('easy_customers').doc(uid).get();
    if (customerDoc.exists) {
      const { id } = customerDoc.data();
      await updateCustomer({ id, data: { firstName: displayName, lastName: '' } });
    }
  });

// const scheduling_onUpdateUser = functions.firestore
//   .document('/users/{docId}')
//   .onUpdate(async (change, context) => {
//     const { before: _before, after: _after } = change;
//     const before = _before.data();
//     const after = _after.data();
//     console.log(after);
//     if (!after.claims || !after.claims.tier) return;
//     if (after.claims.tier === before.claims.tier) return;
//     // If we've reached this point, the user's tier has changed.
//
//     // The user is no longer a provider.
//     if (after.claims.tier === 0) {
//
//     }
//
//     await addProvider(after);
//   });

module.exports = {
  scheduling_onCreateUser,
  scheduling_onUpdateUser,
  scheduling_onDeleteUser,
  // scheduling_onUpdateUser
};
