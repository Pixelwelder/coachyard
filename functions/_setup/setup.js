const admin = require('firebase-admin');
const { project_id, service_account } = require('../__config__/firebase.json');
const { initialize, clear } = require('../schedule/util');

console.log('initializing', project_id);
admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const go = async () => {
  await clear();
  await initialize();
};

go();
