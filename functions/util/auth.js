const checkAuth = (context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user.', { sentData: data });
  }
};

module.exports = { checkAuth };
