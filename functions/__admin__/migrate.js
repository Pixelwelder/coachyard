const admin = require('firebase-admin');
const { project_id, service_account } = require('../config').firebase;
const { newUserMeta } = require('../data');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const migrateItem = async ({ path, type }) => {
  console.log('migrateItem', path, type);
  const ref = admin.firestore().doc(path);
  const doc = await ref.get()
  const item = doc.data();
  console.log(item);
};

const go = async () => {
  await migrateItem({ path: 'users/638AWSJHkkV77Fn8xgSqo8qKqSP2', type: newUserMeta })
};

go();
