const { apiKey } = require('../__config__/daily.json');
const { secret, tokenId } = require('../__config__/mux.json');
const { user, password } = require('../__config__/easy.json');

const getDailyHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${apiKey}`
});

const getMuxHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'Basic ' + Buffer.from(`${tokenId}:${secret}`).toString('base64')
});

const getEasyHeaders = () => ({
  Authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
});

module.exports = { getDailyHeaders, getMuxHeaders, getEasyHeaders };
