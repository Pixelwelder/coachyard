// const { rooms, roomsFE } = require('./rooms');
// const { recordingsFE } = require('./recordings');
// const { createCompositeFE, compositesFE } = require('./composites');
// const { assetsFE } = require('./assets');
// const { processVideo } = require('./ffmpegTest');
// const { video, videoFE } = require('./video');
// const { setPrivilege, addPrivilege } = require('./admin/users');
// const { initDatabase } = require('./admin/init');

// const courses = require('./courses');
// const items = require('./items');
// const sessions = require('./sessions');
// const users = require('./users')
// const invites = require('./invites');
// const billing = require('./billing');

const admin = require('firebase-admin');
const serviceAccount = require('./__config__/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://coach-yard.firebaseio.com',
  storageBucket: 'coach-yard.appspot.com',
  projectId: 'coach-yard'
});

// Only export the function family that was called.
// This is not ideal; I haven't figured out how this works yet.
const functionName = process.env.FUNCTION_NAME || process.env.K_SERVICE;
// if (functionName) {
//
//   console.log('calling function', functionName);
//   if (functionName.includes('Course')) {
//     module.exports = require('./courses');
//   } else if (functionName.includes('Item')) {
//     module.exports = require('./items');
//   } else if (functionName.includes('User')) {
//     module.exports = require('./users');
//   } else if (functionName.includes('stripe')) {
//     module.exports = require('./billing');
//   } else if (functionName.includes('mux')) {
//     module.exports = require('./mux');
//   }
// } else {
//   console.log('Initializing, not calling');
  module.exports = {
    // rooms,
    // roomsFE,
    // recordingsFE,
    // assetsFE,
    // processVideo,
    // compositesFE,
    // createCompositeFE,
    // video,
    // videoFE,
    // setPrivilege,
    // addPrivilege,
    // initDatabase,
    // ...sessions,
    // ...invites,

    ...require('./courses'),
    ...require('./items'),
    ...require('./users'),
    ...require('./billing'),
    ...require('./mux')
  };
// }
