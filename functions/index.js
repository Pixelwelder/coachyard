const admin = require('firebase-admin');
const serviceAccount = require('./__config__/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://coach-yard.firebaseio.com',
  storageBucket: 'coach-yard.appspot.com',
  projectId: 'coach-yard'
});

// Only export the function family that was called.
// This is not ideal; I haven't figured out how this works yet.
const functionName = process.env.FUNCTION_NAME || process.env.K_SERVICE;
module.exports = {
  ...require('./courses'),
  ...require('./items'),
  ...require('./users'),
  ...require('./billing'),
  ...require('./mux')
};
