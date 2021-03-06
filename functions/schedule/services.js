const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { baseUrl } = require('./config.json');
const { getCategories } = require('./categories');

const createService = (overrides) => ({
  id: 74,
  name: "Male Haircut",
  duration: 60,
  price: 10.00,
  currency: "Euro",
  description: "Male haircut trends.",
  location: '',
  availabilitiesType: "flexible",
  attendantsNumber: 1,
  categoryId: null,
  ...overrides
});

const getServices = async () => {
  console.log('getServices');
  const result = await fetch(
    `${baseUrl}/services`,
    {
      headers: getEasyHeaders()
    }
  );

  const json = await result.json();
  console.log(`getServices: ${json.length} found`);
  return json;
};

const clearServices = async () => {
  console.log('clearServices');
  const services = await getServices();
  const promises = await services.map(service => fetch(
    `${baseUrl}/services/${service.id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.DELETE
    }
  ));
  console.log(`clearServices: removed ${services.length}`);
};

const CATEGORY_IDS = {
  LIVE_SESSION: 0
};

const addServices = async () => {
  console.log('addServices');
  // All services go in this category.
  const categories = await getCategories();
  const category = categories.find(category => category.name === 'Generic Timeslots');
  // const services = [15, 30, 45, 60, 75, 90, 105, 120].map((duration, index) => createService({
  // We create one service, because we can specify the length later.
  const services = [CATEGORY_IDS.LIVE_SESSION].map((duration, index) => createService({
    id: index,
    name: `Live Session`,
    duration,
    price: 0,
    currency: 'USD',
    description: `A 1-on-1 live session`,
    availabilityType: 'fixed',
    attendantsNumber: 1,
    categoryId: category.id
  }));
  const promises = services.map(service => fetch(
      `${baseUrl}/services/`,
      {
        headers: getEasyHeaders(),
        method: METHODS.POST,
        body: JSON.stringify(service)
      }
    ));

  await Promise.all(promises);
  console.log(`addServices: added ${services.length}`)
};

module.exports = { addServices, getServices, clearServices };
