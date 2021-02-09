const fetch = require('node-fetch');
const { getEasyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { v4: uuid } = require('uuid');

const createCategory = (overrides) => ({
  id: 5,
  name: "Test Category",
  description: "This category includes test services",
  ...overrides
});

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

const baseUrl = 'http://localhost:8000/index.php/api/v1';

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

const removeCategories = async () => {
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
    {
      id: 0,
      name: 'Generic Timeslots',
      description: 'These are timeslots that can be used for anything.'
    }
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

const removeServices = async () => {
  console.log('removeServices');
  const services = await getServices();
  const promises = await services.map(service => fetch(
    `${baseUrl}/services/${service.id}`,
    {
      headers: getEasyHeaders(),
      method: METHODS.DELETE
    }
  ));
  console.log(`removeServices: removed ${services.length}`);
};

const addServices = async () => {
  console.log('addServices');
  // All services go in this category.
  const categories = await getCategories();
  const category = categories.find(category => category.name === 'Generic Timeslots');
  const services = [15, 30, 45, 60, 75, 90, 105, 120].map((duration, index) => createService({
    id: index,
    name: `${duration}-Minute Slot`,
    duration,
    price: 0,
    currency: 'USD',
    description: `A ${duration}-minute time slot`,
    availabilityType: 'fixed',
    attendantsNumber: 1,
    categoryId: category.id
  }));
  const promises = services.map(async service => {
    const result = await fetch(
      `${baseUrl}/services/`,
      {
        headers: getEasyHeaders(),
        method: METHODS.POST,
        body: JSON.stringify(service)
      }
    );
    console.log(result);
  });

  await Promise.all(promises);
  console.log(`addServices: added ${services.length}`)
};


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

const getSettings = async () => {
  const result = await fetch(
    'http://localhost:8000/index.php/api/v1/settings',
    {
      method: METHODS.GET,
      headers: getEasyHeaders()
    }
  );

  const json = await result.json();
  return json;
};

/*
$encoded_response = [
            'id' => array_key_exists('id', $response) ? (int)$response['id'] : NULL,
            'firstName' => $response['first_name'],
            'lastName' => $response['last_name'],
            'email' => $response['email'],
            'mobile' => $response['mobile_number'],
            'phone' => $response['phone_number'],
            'address' => $response['address'],
            'city' => $response['city'],
            'state' => $response['state'],
            'zip' => $response['zip_code'],
            'notes' => $response['notes'],
            'timezone' => $response['timezone'],
        ];
 */
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
