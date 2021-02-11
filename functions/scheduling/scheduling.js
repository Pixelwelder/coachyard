const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { v4: uuid } = require('uuid');
const { baseUrl } = require('./config.json');
const { addCategories, clearCategories, getCategories } = require('./categories');
const { addServices, clearServices, getServices } = require('./services');
const { clearProviders, listProviders, addProvider } = require('./providers');
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

const __INIT__ = async () => {
  await clear()
  await initialize();
  console.log('done');
}

const go2 = async () => {
  // const providers = await listProviders();
  const provider = await addProvider({ uid: '55', email: 'test@mailinator.co', password: 'password' });
  console.log(provider);
};

go2();
