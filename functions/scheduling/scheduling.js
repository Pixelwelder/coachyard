const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { v4: uuid } = require('uuid');
const { baseUrl } = require('./config.json');
const { addCategories, removeCategories, getCategories } = require('./categories');
const { addServices, removeServices, getServices } = require('./services');

const createProvider = () => ({
  "id": 143,
  "firstName": "Chloe",
  "lastName": "Doe",
  "email": "zjordan@mailinator.com",
  "mobile": "012345679-0",
  "phone": "0123456789-1",
  "address": "Some Str. 123",
  "city": "Some City",
  "state": "Some State",
  "zip": "12345",
  "notes": "Test provider notes.",
  "services": [
    2, 3, 4
  ],
  "settings":{
    "username": "zjordan",
    password: 'password',
    "notifications":true,
    "googleSync":true,
    "googleCalendar": "calendar-id",
    "googleToken": "23897dfasdf7a98gas98d9",
    "syncFutureDays":10,
    "syncPastDays":10,
    "calendarView": "default",
    "workingPlan":{
      monday:{
        "start": "09:00",
        "end": "18:00",
        "breaks":[
          {
            "start": "14:30",
            "end": "15:00"
          }
        ]
      },
      tuesday:{
        "start": "09:00",
        "end": "18:00",
        "breaks":[
          {
            "start": "14:30",
            "end": "15:00"
          }
        ]
      },
      wednesday:null,
      thursday:{
        "start": "09:00",
        "end": "18:00",
        "breaks":[
          {
            "start": "14:30",
            "end": "15:00"
          }
        ]
      },
      friday:{
        "start": "09:00",
        "end": "18:00",
        "breaks":[
          {
            "start": "14:30",
            "end": "15:00"
          }
        ]
      },
      saturday:null,
      sunday:null
    }
  }
});

const initialize = async () => {
  console.log('----- INITITALIZE -----');
  await addCategories();
  await addServices();
};

const clear = async () => {
  console.log('----- CLEAR -----');
  await removeCategories();
  await removeServices()
};

// const getSettings = async () => {
//   const result = await fetch(
//     'http://localhost:8000/index.php/api/v1/settings',
//     {
//       method: METHODS.GET,
//       headers: getEasyHeaders()
//     }
//   );
//
//   const json = await result.json();
//   return json;
// };

const post = async () => {
  console.log('go');
  // When we create a new provider, we give them all services.
  // const services = await getServices();
  const result = await fetch(
    'http://localhost:8000/index.php/api/v1/providers',
    {
      method: METHODS.POST,
      headers: getEasyHeaders(),
      body: JSON.stringify(createProvider())
    }
  );
  try {
    console.log(result);
    console.log('---');
    const json = await result.json();
    console.log(json);
  } catch (error) {
    console.log(error);
  }
};

const go = async () => {
  await clear()
  await initialize();
  console.log('done');
}

const go2 = async () => {
  const result = await getCategories();
  console.log(result);
};

go();
