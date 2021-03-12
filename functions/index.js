const admin = require('firebase-admin');
const { project_id, service_account } = require('./__config__/firebase.json');
const functions = require('firebase-functions');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

// Only export the function family that was called.
// This is not ideal; I haven't figured out how this works yet.
// const functionName = process.env.FUNCTION_NAME || process.env.K_SERVICE;
module.exports = {
  ...require('./courses'),
  ...require('./items'),
  ...require('./users'),
  ...require('./billing'),
  ...require('./mux'),
  ...require('./daily'),
  ...require('./schedule'),
  ...require('./chat')
};
