// TODO - Duped in front end.
const newBaseItem = (overrides) => ({
  uid: '', // Always store the uid when created.
  created: '',
  updated: '',
  ...overrides
});

/**
 * TODO - Remove. Moved to front end.
 */
const newUserMeta = (overrides) => ({
  ...newBaseItem(),
  displayName: '', // TODO Make sure we change this when they update elsewhere.
  email: '',       // TODO Same.
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

// TODO - Remove.
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
  image: '',

  // This may be an email or a uid.
  student: '',

  ...overrides
});

const newCourseItem = (overrides) => ({
  ...newBaseItem(),
  creatorUid: '',
  courseUid: '',
  displayName: '',
  description: '',
  image: '',

  // This is for invites.
  date: '',
  room: false,
  isAccepted: false,   // TODO Remove
  isCompleted: false,  // TODO Remove
  isInProgress: false, // TODO Remove
  status: 'viewable', // scheduled, live, processing, viewable

  // This is for associated media.
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
