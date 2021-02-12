const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { baseUrl } = require('./config.json');
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

const _addCustomer = createAdd({ url: `${baseUrl}/customers` });
const addCustomer = async ({ uid, email }) => {
  const customer = createCustomer({
    firstName: email,
    lastName: uid,
    email
  });
  const result = await _addCustomer({ data: customer });
  return result;
};

const _updateCustomer = createUpdate({ url: `${baseUrl}/customers` })
const updateCustomer = async ({ id, data }) => {
  const existingCustomer = getCustomer({ id });
  const newCustomer = { ...existingCustomer, ...data };
  const result = await _updateCustomer({ id, data: newCustomer });
  return result;
};

const getCustomer = createGet({ url: `${baseUrl}/customers` });
const listCustomers = createList({ url: `${baseUrl}/customers` });
const deleteCustomer = createDelete({ url: `${baseUrl}/customers` });
const clearCustomers = createClear({ url: `${baseUrl}/customers`, listFunc: listCustomers });

module.exports = { addCustomer, updateCustomer, deleteCustomer, getCustomer, listCustomers, clearCustomers };
