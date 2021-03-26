const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { url } = require('../__config__/easy.json');
const { getServices } = require('./services');
const { createGet, createList, createAdd, createDelete, createClear, createUpdate } = require('./base');

const createCustomer = (overrides) => ({
  id: 97,
  firstName: "John",
  lastName: "Doe",
  email: "john@doe.com",
  phone: "0123456789",
  address: "Some Str. 123",
  city: "Some City",
  zip: "12345",
  notes: "Test customer notes.",
  ...overrides
});

const _addCustomer = createAdd({ url: `${url}/customers` });
const addCustomer = async ({ uid, email }) => {
  const customer = createCustomer({
    firstName: email,
    lastName: uid,
    email
  });
  const result = await _addCustomer({ data: customer });
  return result;
};

const _updateCustomer = createUpdate({ url: `${url}/customers` })
const updateCustomer = async ({ id, data }) => {
  const existingCustomer = getCustomer({ id });
  const newCustomer = { ...existingCustomer, ...data };
  const result = await _updateCustomer({ id, data: newCustomer });
  return result;
};

const getCustomer = createGet({ url: `${url}/customers` });
const listCustomers = createList({ url: `${url}/customers` });
const deleteCustomer = createDelete({ url: `${url}/customers` });
const clearCustomers = createClear({ url: `${url}/customers`, listFunc: listCustomers });

module.exports = { addCustomer, updateCustomer, deleteCustomer, getCustomer, listCustomers, clearCustomers };
