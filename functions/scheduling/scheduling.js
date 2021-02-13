const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { v4: uuid } = require('uuid');
const { baseUrl } = require('./config.json');
const { addCategories, clearCategories, getCategories } = require('./categories');
const { addServices, clearServices, getServices } = require('./services');
const { clearProviders, listProviders, addProvider, updateProvider } = require('./providers');
const { addCustomer, updateCustomer, deleteCustomer, getCustomer, listCustomers, clearCustomers } = require('./customers');


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
  // const result = await addCustomer({ uid: '123', email: 'tester@tester.co' });
  // const result = await updateCustomer({ id: 55, data: { lastName: 'Jordan' } });
  // const result = await getCustomer({ id: 54 });
  // const result = await deleteCustomer({ id: 55 });
  // const result = await clearCustomers();
  // const result = await updateProvider({ id: 53, data: { city: 'Here Goes Nothing' } });
  const result = await listProviders();
  console.log(result);
  // const provider = await addProvider({ uid: '55', email: 'test@mailinator.co', password: 'password' });
  // const result = await listCustomers();
};

go2();
// __INIT__();
