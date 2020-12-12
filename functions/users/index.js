const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');

// Create user - POST
// Get user - GET
// Delete user - DELETE
// Get all users - GET

const createUserMeta = (overrides) => ({
  uid: 'uid',
  ...overrides
});

// Updates user meta to new version.
const upgradeUserMeta = () => {};

const onCreateUser = (user) => {
  // Create a matching entry in the database.
  // const user = admin.firestore()
}

const onDeleteUser = (user) => {

};

const getUser = (data, context) => {};

module.exports = {
  onCreateUser: functions.auth.user().onCreate(onCreateUser),
  onCreateUser: functions.auth.user().onDelete(onDeleteUser)
}
