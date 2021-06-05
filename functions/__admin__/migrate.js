const admin = require('firebase-admin');
const { project_id, service_account } = require('../config').firebase;
const { constructorMap } = require('../data');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const backUpCollection = async ({
  collectionName,
  targetDocName
}) => {
  console.log(`backing up ${collectionName} to ${targetDocName}`)
  const docs = await admin.firestore().collection(collectionName).get();
  console.log(`found ${docs.size} docs in ${collectionName}`)
  const targetCollection = admin.firestore().doc(targetDocName).collection(collectionName);
  const promises = docs.docs.map(async (doc) => {
    console.log(`doc ${doc.id}...`)
    const targetDoc = targetCollection.doc(doc.id);
    await targetDoc.set(doc.data());
    // Now children.
    const subNames = (await doc.ref.listCollections()).map(({ id }) => id);
    if (subNames.length) {
      // Only one level instead of TODO recursive
      await Promise.all(
        subNames.map(async (subCollectionName) => {
          const subDocs = await doc.ref.collection(subCollectionName).get();
          console.log(`found ${subDocs.size} subdocs in ${subCollectionName}`);
          await Promise.all(
            subDocs.docs.map((subDoc) => targetDoc
              .collection(subCollectionName).doc(subDoc.id).set(subDoc.data()))
          );
        })
      );
    }
  });
  await Promise.all(promises);

  console.log(`${collectionName} is backed up`);
};

// First, we back up everything.
const backUp = async () => {
  const dateString = new Date().toJSON();//.split('T')[0];

  await Promise.all(
    ['courses', 'easy_customers', 'easy_providers', 'stripe_customers', 'stripe_events', 'tokens', 'users']
      .map(collectionName => backUpCollection({
        collectionName,
        targetDocName: `_backups/${dateString}`
      }))
  );

  // stripe_customers, courses

  // tokens from old schema to new

  // const backupPath = `__backups__/${dateString}/${path}`;
  // await admin.firestore().doc(backupPath).set(item);
  console.log('backed up');
};

const migrateItem = async ({ path, constructor }) => {
  const ref = admin.firestore().doc(path);
  const doc = await ref.get()
  const item = doc.data();


  // console.log(item);
};

const go = async () => {
  await backUp();
  // await migrateItem({ path: 'users/638AWSJHkkV77Fn8xgSqo8qKqSP2', type: 'users' })
};

go();
