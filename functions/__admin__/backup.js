const admin = require('firebase-admin');
const { project_id, service_account } = require('../config').firebase;

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const backUpCollection = async ({
  collectionName,
  targetDocName,
  dateString
}) => {
  console.log(`backing up ${collectionName} to ${targetDocName}`);
  const docs = await admin.firestore().collection(collectionName).get();
  console.log(`found ${docs.size} docs in ${collectionName}`);
  await admin.firestore().doc(targetDocName).set({ created: dateString });
  const targetCollection = admin.firestore().doc(targetDocName).collection(collectionName);
  const promises = docs.docs.map(async (doc) => {
    // console.log(`doc ${doc.id}...`)
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

const backupDir = '_backups';
const backupFields = ['courses', 'easy_customers', 'easy_providers', 'stripe_customers', 'stripe_events', 'tokens', 'users', 'items'];
const backUp = async () => {
  const dateString = new Date().toJSON();//.split('T')[0];
  console.log(`--- BACKING UP ${dateString} ---`);

  await Promise.all(
    backupFields
      .map(collectionName => backUpCollection({
        collectionName,
        targetDocName: `${backupDir}/${dateString}`,
        dateString
      }))
  );

  console.log('backed up');
};

const nuke = async () => {
  console.log(' --- NUKE --- ');
  await Promise.all(backupFields.map(async (field) => {
    const docs = await admin.firestore().collection(field).get();
    console.log(`nuking ${docs.size} docs in ${field}.`);
    await Promise.all(docs.docs.map((doc) => {
      return doc.ref.delete();
    }));
  }));
  console.log('nuke complete');
};

// Restores the most recent.
const restore = async () => {
  // First we back up.
  await backUp();

  // Now we nuke.
  await nuke();

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('--- RESTORING ---')
  // Since we just backed up, skip the most recent.
  const backupDoc = (await admin.firestore()
    .collection(backupDir).orderBy('created', 'desc').limit(2).get()).docs[1];
  const { created } = backupDoc.data();
  console.log('restoring backup created:', created);
  const subNames = (await backupDoc.ref.listCollections()).map(({ id }) => id);
  console.log('restoring', subNames.join(', '));
  await Promise.all(subNames.map(async (subName) => {
    const docs = await backupDoc.ref.collection(subName).get();
    console.log(`restoring ${docs.size} docs in ${subName}...`)
    await Promise.all(docs.docs.map((doc) => {
      // TODO Currently does not erase.
      return admin.firestore().collection(subName).doc(doc.id).set(doc.data());
    }));
  }));
  console.log('restore complete');
};

const go = () => {
  backUp();
  // restore();
};

go();
