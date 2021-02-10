const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { baseUrl } = require('./config.json');
const { getServices } = require('./services');

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

const addCustomer = async ({ uid, email }) => {
  console.log('addCustomer');
  const customer = createCustomer({
    firstName: email,
    lastName: uid,
    email
  });
  const result = await fetch(
    `${baseUrl}/customers`,
    {
      headers: getEasyHeaders(),
      method: METHODS.POST,
      body: JSON.stringify(customer)
    }
  );
  console.log('addCustomer: complete');
  const json = await result.json();
  return json;
};

const deleteCustomer = async (id) => {
  console.log('deleteCustomer');
  const result = await fetch(
    `${baseUrl}/customers/${id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.POST
    }
  );
  console.log('deleteCustomer: complete');
  return result;
};

module.exports = { addCustomer, deleteCustomer };
