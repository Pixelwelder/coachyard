const admin = require('firebase-admin');
const { v4: uuid } = require('uuid');

const uploadImage = async ({ destination, path = 'generic-teacher-cropped.png' }) => {
  const bucket = admin.storage().bucket();
  await bucket.upload(
    path,
    {
      destination,
      gzip: true,
      metadata: {
        contentType: 'image/png',
        metadata: {
          // Allows us to see the image in Firebase Admin UI
          firebaseStorageDownloadTokens: uuid(),
          cacheControl: 'public,max-age=31536000'
        }
      }
    }
  );
};

// uploadImage({ destination: 'courses/123.png' });

module.exports = {
  uploadImage
};
