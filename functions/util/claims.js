const admin = require('firebase-admin');

const setClaims = async ({ uid, claims }) => {
  // Set user claims.
  // TODO Call this from the Stripe webhook?
  const user = await admin.auth().getUser(uid);
  const currentClaims = user.customClaims;
  const mergedClaims = { ...currentClaims, ...claims };
  await admin.auth().setCustomUserClaims(uid, mergedClaims);
  await admin.firestore().collection('users').doc(uid).update({ claims: mergedClaims }); // For notification.
};

module.exports = { setClaims };
