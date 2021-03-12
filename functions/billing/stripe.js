const { Stripe } = require('stripe');
const { secret_key } = require('../__config__/stripe.json');

const stripe = new Stripe(
  secret_key,
  { apiVersion: '2020-08-27' }
);

module.exports = stripe;
