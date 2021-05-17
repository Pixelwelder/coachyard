const { url } = require('../config').easy;
const { getServices } = require('./services');
const { createGet, createList, createAdd, createDelete, createClear, createUpdate } = require('./base');

const createDuration = (overrides) => ({
  start: "08:00",
  end: "18:00",
  ...overrides
});

const createDay = (overrides) => {
  const day = {
    ...createDuration({
      start: "08:00",
      end: "18:00"
    }),
    breaks: [
      createDuration({
        start: "12:00",
        end: "13:00"
      })
    ]
  };
  return day;
};

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createWorkingPlan = () => {
  const workingPlan = days.reduce((accum, day) => ({
    ...accum,
    [day]: createDay()
  }), {});
  return workingPlan;
};

const createSettings = (overrides) => ({
  username: 'zjordan',
  password: 'password',
  notifications: false,
  googleSync: false,
  googleCalendar: 'calendar-id',
  googleToken: '23897dfasdf7a98gas98d9',
  syncFutureDays: 10,
  syncPastDays: 10,
  calendarView: 'default',
  working_plan: createWorkingPlan(),
  ...overrides
});

const createProvider = (overrides) => ({
  id: 143,
  firstName: 'Chloe',
  lastName: 'Doe',
  email: 'zjordan@mailinator.com',
  mobile: '012345679-0',
  phone: '0123456789-1',
  address: 'Some Str. 123',
  city: 'Some City',
  state: 'Some State',
  zip: '12345',
  timezone: 'America/Chicago', // TODO
  notes: 'Test provider notes.',
  services: [
    2, 3, 4
  ],
  settings: createSettings(),
  ...overrides
});

const _addProvider = createAdd({ url: `${url}/providers` });
const addProvider = async ({ uid, email, password }) => {
  const _services = await getServices();
  const services = _services.map(service => service.id);
  const settings = createSettings({
    username: uid,
    password
  });
  const provider = createProvider({
    // id: uid,
    firstName: email,
    lastName: uid,
    email,
    services,
    settings
  });
  const result = await _addProvider({ data: provider });
  return result;
};

const _updateProvider = createUpdate({ url: `${url}/providers` });
const updateProvider = async ({ id, data }) => {
  const existingProvider = await getProvider(id);
  const newProvider = { ...existingProvider, ...data }; // TODO Does not handle nesting.
  const result = await _updateProvider({ id, data });
  return result;
};

const getProvider = createGet({ url: `${url}/providers` });
const listProviders = createList({ url: `${url}/providers`});
const deleteProvider = createDelete({ url: `${url}/providers` });
const clearProviders = createClear({ url: `${url}/providers`, listFunc: listProviders });

module.exports = {
  createDuration, createDay, createSettings,
  addProvider, updateProvider, deleteProvider, getProvider, listProviders, clearProviders
};
