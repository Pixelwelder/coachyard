const admin = require('firebase-admin');
const fs = require('fs');
const jdenticon = require('jdenticon');
const { v4: uuid } = require('uuid');
const Buffer = require('buffer').Buffer;
const { project_id, service_account } = require('../__config__/firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const isLive = false;//process.env.FUNCTIONS_EMULATOR === "true";

const _createIcon = async ({ uid }) => {
  // Create icon.
  const png = jdenticon.toPng(uid, 200);
  const pathRoot = isLive ? '/temp/' : './';
  const path = `${pathRoot}${uid}.png`;
  const buffer = Buffer.from(png);
  // fs.writeFileSync(path, png);

  await admin.storage().bucket().file(`avatars/${uid}.png`).save(buffer, {
    metadata: {
      fileType: 'image/png',
      metadata: {
        firebaseStorageDownloadTokens: uuid()
      }
    }
  });

  // await admin.storage().bucket().upload(buffer, {
  //   destination: `avatars/${uid}.png`,
  //   metadata: {
  //     fileType: 'image/png',
  //     metadata: {
  //       firebaseStorageDownloadTokens: uuid()
  //     }
  //   }
  // });

  // await admin.firestore().collection('users').doc(uid).update({ image: `${uid}.png`});

  // try {
  //   fs.unlinkSync(path);
  // } catch (error) {
  //   console.error(error);
  // }

  console.log(`uploaded ${uid}.png`);
};

_createIcon({ uid: `000-temp-${Math.random()}` });
// _createIcon({ uid: `1234` });
