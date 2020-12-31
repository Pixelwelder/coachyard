const admin = require('firebase-admin');
const serviceAccount = require('./__config__/firebase-service-account.json');

const { rooms, roomsFE } = require('./rooms');
const { recordingsFE } = require('./recordings');
const { createCompositeFE, compositesFE } = require('./composites');
const { assetsFE } = require('./assets');
const { processVideo } = require('./ffmpegTest');
const { video, videoFE } = require('./video');
const { setPrivilege, addPrivilege } = require('./admin/users');
const { initDatabase } = require('./admin/init');
const courses = require('./courses');
const items = require('./items');
const sessions = require('./sessions');
const users = require('./users')
const invites = require('./invites');
const billing = require('./billing');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://coach-yard.firebaseio.com',
  storageBucket: 'coach-yard.appspot.com',
  projectId: 'coach-yard'
});

module.exports = {
  rooms,
  roomsFE,
  recordingsFE,
  assetsFE,
  processVideo,
  compositesFE,
  createCompositeFE,
  video,
  videoFE,
  setPrivilege,
  addPrivilege,
  initDatabase,
  ...courses,
  ...items,
  ...sessions,
  ...users,
  ...invites,
  ...billing
};
