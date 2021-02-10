const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { addProvider, deleteProvider } = require('./providers');

const scheduling_onCreateUser = functions.auth.user()
  .onCreate(async (user, context) => {
    const { uid, email } = user;
    const easyResult = await addProvider({ uid, email });
    await admin.firestore().collection('easy_users').doc(uid).set(easyResult);
  })

const scheduling_onDeleteUser = functions.auth.user()
  .onDelete(async (user, context) => {
    const { uid } = user;
    const easyDoc = await admin.firestore().collection('easy_users').doc(uid).get();
    const { id } = easyDoc.data();
    await deleteProvider(id);
    await easyDoc.ref.delete();
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
  scheduling_onDeleteUser,
  // scheduling_onUpdateUser
};
