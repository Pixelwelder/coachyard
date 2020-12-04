const { apiKey } = require('../__config__/daily.json');
const { secret, tokenId } = require('../__config__/mux.json');

const getDailyHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`
});

const getMuxHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + new Buffer(`${tokenId}:${secret}`).toString('base64')
});

module.exports = { getDailyHeaders, getMuxHeaders };
