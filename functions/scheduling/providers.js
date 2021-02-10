const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { baseUrl } = require('./config.json');
const { getServices } = require('./services');

const createDuration = (overrides) => ({
  start: "00:00",
  end: "23:59",
  ...overrides
});

const createDay = (overrides) => ({
  ...createDuration({
    // start: "06:00",
    // end: "22:00"
  }),
  breaks: [
    createDuration({
      start: "12:00",
      end: "1:00"
    })
  ]
});

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createSettings = (overrides) => ({
  username: "zjordan",
  password: 'password',
  notifications: false,
  googleSync: false,
  googleCalendar: "calendar-id",
  googleToken: "23897dfasdf7a98gas98d9",
  syncFutureDays: 10,
  syncPastDays: 10,
  calendarView: "default",
  workingPlan: days.reduce((accum, day) => ({
    ...accum,
    [day]: createDay()
  }), {}),
  ...overrides
});

const createProvider = (overrides) => ({
  id: 143,
  firstName: "Chloe",
  lastName: "Doe",
  email: "zjordan@mailinator.com",
  mobile: "012345679-0",
  phone: "0123456789-1",
  address: "Some Str. 123",
  city: "Some City",
  state: "Some State",
  zip: "12345",
  notes: "Test provider notes.",
  services: [
    2, 3, 4
  ],
  settings: createSettings(),
  ...overrides
});

const getProviders = async () => {
  const result = await fetch(
    `${baseUrl}/providers`,
    {
      headers: getEasyHeaders()
    }
  );

  const json = await result.json();
  console.log(json);
  return json;
};

const getProvider = async () => {};

const deleteProvider = async (id) => {
  console.log('deleteProvider:', id);
  const result = await fetch(
    `${baseUrl}/providers/${id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.DELETE
    }
  )
  console.log(result);
  console.log('deleteProvider: complete');
};

const deleteProviders = async () => {};

const addProvider = async ({ uid, email }) => {
  console.log('addProvider:', uid, email);
  const _services = await getServices();
  const services = _services.map(service => service.id);
  const settings = createSettings({
    username: uid,
    password: 'password', // TODO
  });
  const provider = createProvider({
    // id: uid,
    firstName: email,
    lastName: uid,
    email,
    services,
    settings
  });
  console.log('sending provider', provider);

  const result = await fetch(
    `${baseUrl}/providers`,
    {
      method: METHODS.POST,
      headers: getEasyHeaders(),
      body: JSON.stringify(provider)
    }
  );

  const json = await result.json();
  console.log('addProvider: complete');
  return json;
};

module.exports = { addProvider, deleteProvider };
