const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');
const { log } = require ('../logging');
const { setClaims } = require('../util/claims');
const stripe = require('./stripe');
const webhooks = require('./webhooks');
const subscription = require('./subscription');
const courseSubscription = require('./course-subscription');

module.exports = {
  ...subscription,
  ...courseSubscription,
  ...webhooks
};
