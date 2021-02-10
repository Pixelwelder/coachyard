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
      method: METHODS.DELETE
    }
  );
  const json = await result.json();
  console.log('deleteCustomer: complete');
  return json;
};

const getCustomers = async () => {
  console.log('getCustomers');
  const customers = await fetch(
    `${baseUrl}/customers`,
    {
      headers: getEasyHeaders()
    }
  );
  const json = await customers.json();
  console.log(`getCustomers: ${json.length} found`);
  return json;
};

const clearCustomers = async () => {
  console.log('clearCustomers');
  const customers = await getCustomers();
  const promises = customers.map(customer => fetch(
    `${baseUrl}/customers/${customer.id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.DELETE
    }
  ));
  await Promise.all(promises);
  console.log(`clearCustomers: cleared ${customers.length}`);
};

module.exports = { addCustomer, deleteCustomer, getCustomers, clearCustomers };
