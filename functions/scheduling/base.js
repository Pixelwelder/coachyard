const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');

const createGet = ({ url }) => async ({ id } = {}) => {
  const fullUrl = id === undefined ? url : `${url}/${id}`;
  console.log(`GET ${fullUrl}`);
  const result = await fetch(
    fullUrl,
    {
      headers: getEasyHeaders()
    }
  );
  const json = await result.json();
  console.log(`GET ${url}: ${id === 'undefined' ? 'complete' : 'found ' + json.length }`);
  return json;
};

const createList = createGet;

const createAdd = ({ url }) => async ({ data }) => {
  console.log(`ADD ${url}`);
  console.log(data);
  const result = await fetch(
    url,
    {
      method: METHODS.POST,
      headers: getEasyHeaders(),
      body: JSON.stringify(data)
    }
  );
  const json = await result.json();
  console.log(`ADD ${url} complete`);
  return json;
};

const createUpdate = ({ url }) => async () => {

};

const createDelete = ({ url }) => async ({ id }) => {
  console.log(`DELETE ${url}: ${id}`);
  const result = await fetch(
    `${url}/${id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.DELETE
    }
  );
  const json = await result.json();
  console.log(`DELETE ${url}: complete`);
  return json;
};

const createClear = ({ url, listFunc }) => async () => {
  console.log('clearProviders');
  const items = await listFunc();
  const promises = items.map((item) => fetch(
    `${url}/${item.id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.DELETE
    }
  ));
  await Promise.all(promises);
  console.log(`clearProviders: cleared ${items.length}`);
  return {};
};

module.exports = { createGet, createList, createAdd, createDelete, createClear };
