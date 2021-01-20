const admin = require('firebase-admin');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const jdenticon = require('jdenticon');
const serviceAccount = require('../__config__/firebase-prod.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://coach-yard.firebaseio.com',
  storageBucket: 'coach-yard.appspot.com',
  projectId: 'coach-yard'
});

const _createIcon = async ({ uid }) => {
  // Create icon.
  const png = jdenticon.toPng(uid, 200);
  const path = `/tmp/${uid}.png`;
  fs.writeFileSync(path, png);

  await admin.storage().bucket().upload(path, {
    destination: `avatars/${uid}.png`,
    metadata: {
      fileType: 'image/png',
      metadata: {
        firebaseStorageDownloadTokens: uuid()
      }
    }
  });
  fs.unlinkSync(path);
};

// CAUTION Runs on production.
const updateMeta = async () => {
  console.log('updating...');
  const result = await admin.firestore().runTransaction(async (transaction) => {
    const usersRef = admin.firestore().collection('users');
    const users = await transaction.get(usersRef);

    console.log('updating', users.size, 'users');
    const promises = users.docs.map((user) => transaction.update(
      user.ref, { version: 2, tier: 0 }
    ));

    await Promise.all(promises).catch(error => console.error(error));
  });

  console.log('update complete');
};

const updateImage = async () => {
  console.log('updating...');
  const users = await admin.firestore().collection('users').get();
  const promises = users.docs.map(async (doc) => {
    await _createIcon({ uid: doc.id });
  });

  await Promise.all(promises);
  console.log('complete');
};
