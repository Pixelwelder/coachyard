const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { checkAuth, checkPrivileges } = require('../util/auth');
const express = require('express');

const USER_PRIVILEGES = {
  IS_MEMBER: 1,
  IS_ADMIN: 8
};

const setPrivilege = async (data, context) => {
  // Only an admin can set an admin. TODO.
  if (!checkAuth(context)) {
    throw new functions.https.HttpsError('unauthenticated', 'No logged-in user.');
  }
  if (!checkPrivileges(context.auth, USER_PRIVILEGES.IS_ADMIN)) {
    throw new functions.https.HttpsError('permission-denied', 'Not an admin.');
  }
  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Param "uid" required');
  }

  const user = await admin.auth().getUser(uid);
  console.log('USER', user);
  // await admin.auth().setCustomUserClaims()
};

const app = express();

app.get('/', async (req, res) => {
  const { uid } = req.query;
  console.log('searching for', uid);
  const user = await admin.auth().getUser(uid);
  const { customClaims = {} } = user;
  const { privileges = 0 } = customClaims;

  console.log('Current privileges:', privileges);

  // Adding Admin.
  const newPrivileges = privileges | USER_PRIVILEGES.IS_ADMIN;
  await admin.auth().setCustomUserClaims(uid, { ...customClaims, privileges: newPrivileges });
  // await admin.auth().setCus

  // console.log(user);

  res
    .status(200)
    .json({ message: 'Done.' })
    .end();
});

// TODO Absolutely gigantic security risk.
const app2 = express();
app2.get('/', async (req, res) => {
  // const { uid, privileges } = req.query;
  //
  // await admin.auth().setCustomUserClaims(uid, { privileges })
  // const user = await admin.auth().getUser(uid);

  return res
    .status(200)
    // .json(user)
    .end();
})

module.exports = {
  setPrivilege: functions.https.onCall(setPrivilege),
  addPrivilege: functions.https.onRequest(app2)
};
