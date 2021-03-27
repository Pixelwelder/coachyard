const { addCategories, clearCategories } = require('./categories');
const { addServices, clearServices } = require('./services');
const { clearProviders, listProviders } = require('./providers');
const { clearCustomers } = require('./customers');

const initialize = async () => {
  console.log('----- INITITALIZE -----');
  await addCategories();
  await addServices();
};

const clear = async () => {
  console.log('----- CLEAR -----');
  await clearProviders();
  await clearCustomers();
  await clearServices();
  await clearCategories();
};

module.exports = {
  initialize,
  clear
};
