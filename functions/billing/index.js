const webhooks = require('./webhooks');
const subscription = require('./subscription');
const courseSubscription = require('./course-subscription');
const initializePurchase = require('./initializePurchase');

module.exports = {
  ...subscription,
  ...courseSubscription,
  ...webhooks,
  ...initializePurchase
};
