const { apiKey } = require('../__config__/daily.json');

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`
});

module.exports = { getHeaders };
