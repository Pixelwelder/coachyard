const admin = require('firebase-admin');
const serviceAccount = require('./__config__/firebase-service-account.json');

const { rooms, roomsFE } = require('./rooms');
const { recordingsFE } = require('./recordings');
const { processVideo } = require('./ffmpegTest');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://coach-yard.firebaseio.com',
  storageBucket: 'coach-yard.appspot.com'
});

module.exports = {
  rooms,
  roomsFE,
  recordingsFE,
  processVideo
};
