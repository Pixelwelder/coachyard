const { apiKey } = require('../config').daily;
const { secret, tokenId } = require('../config').mux;
const { user, password } = require('../config').easy;

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
