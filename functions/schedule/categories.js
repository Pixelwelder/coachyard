const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { baseUrl } = require('./config.json');

const createCategory = (overrides) => ({
  id: 5,
  name: "Test Category",
  description: "This category includes test services",
  ...overrides
});

const getCategories = async () => {
  console.log('getCategories');
  const result = await fetch(
    `${baseUrl}/categories`,
    {
      method: METHODS.GET,
      headers: getEasyHeaders()
    }
  );

  const json = await result.json();
  console.log(`getCategories: fetched ${json.length} categories`);
  return json;
}

const clearCategories = async () => {
  console.log(`removing categories`);
  const categories = await getCategories();
  const promises = categories.map(category => fetch(
    `${baseUrl}/categories/${category.id}`,
    {
      method: METHODS.DELETE,
      headers: getEasyHeaders()
    }
  ));
  await Promise.all(promises);
  console.log(`${categories.length} categories removed`);
}

const addCategories = async () => {
  console.log('addCategories');
  const categories = [
    createCategory({
      id: 0,
      name: 'Generic Timeslots',
      description: 'These are timeslots that can be used for anything.'
    })
  ];

  const promises = categories.map(category => {
    return fetch(
      `${baseUrl}/categories`,
      {
        method: METHODS.POST,
        headers: getEasyHeaders(),
        body: JSON.stringify(category)
      }
    );
  });

  await Promise.all(promises);
  console.log(`addCategories: added ${categories.length} categories`)
  return categories;
};

module.exports = { getCategories, clearCategories, addCategories };
