const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

const init = (data, context) => {
  // admin.firestore().collection(''
};

const app = express();
app.get('/', () => {

});

module.exports = {
  initDatabase: functions.https.onRequest(app)
};
