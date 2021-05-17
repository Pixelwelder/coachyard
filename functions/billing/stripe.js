const { Stripe } = require('stripe');
const { secret_key } = require('../config').stripe;

const stripe = new Stripe(
  secret_key,
  { apiVersion: '2020-08-27' }
);

module.exports = stripe;
