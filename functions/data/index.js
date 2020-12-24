// TODO - Duped in front end.
const newBaseItem = (overrides) => ({
  uid: '', // Always store the uid when created.
  created: '',
  updated: '',
  ...overrides
});

const newUserMeta = (overrides) => ({
  ...newBaseItem(),
  students: [],
  enrolled: {},
  ...overrides
});

const newStripeCustomer = (overrides) => ({
  ...newBaseItem(),
  customer_id: '',
  setup_secret: '',
  ...overrides
});

const newStripePayment = (overrides) => ({
  amount: 0,
  currency: '',
  customer: '',
  payment_method: '',
  off_session: false,
  confirm: true,
  confirmation_method: 'manual'
});

// TODO - Remove.
const newStudent = (overrides) => ({
  ...newBaseItem(),
  email: '',
  ...overrides
});

// TODO - Remove (moved to front end).
const newInvite = (overrides) => ({
  ...newBaseItem(),
  creatorUid: '',
  creatorDisplayName: '',
  email: '',
  displayName: '',
  date: '',
  accepted: false,
  completed: false,
  inProgress: false,
  ...overrides
});

const newCourse = (overrides) => ({
  ...newBaseItem(),
  creatorUid: '',
  displayName: '',
  description: '',
  ...overrides
});

const newCourseItem = (overrides) => ({
  ...newBaseItem(),
  uid: '',
  creatorUid: '',
  courseUid: '',
  displayName: '',
  description: '',

  originalFilename: '',
  streamingId: '',
  playbackId: '',

  ...overrides
});

module.exports = {
  newUserMeta,
  newStripeCustomer,
  newStripePayment,
  newStudent,
  newInvite,
  newCourse,
  newCourseItem
};
