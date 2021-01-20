// TODO Factory method that handles timestamps.
const newBaseItem = (overrides) => ({
  version: 0,
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
  version: 2,
  email: '', // TODO Update this when the authUser updates.
  image: '',
  tier: 0,
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
  status: 'viewing', // scheduled, initializing, live, uploading, processing, viewing

  // This is for associated media.
  originalFilename: '',
  streamingId: '',
  playbackId: '',

  ...overrides
});

/**
 * This represents the relationship between a user and a course.
 * It contains basic info about a course that can be used to display it.
 * It must be updated every time its course is updated.
 */
const newCourseToken = (overrides) => ({
  ...newBaseItem(),
  user: '', // Could be email (if pending) or uid.
  courseUid: '',
  access: 'student', // 'student' | 'editor' | 'admin'

  // Abbreviated Course
  displayName: '',
  description: '',
  image: '',

  ...overrides
});

module.exports = {
  newUserMeta,
  newStripeCustomer,
  newStripePayment,
  newStudent,
  newInvite,
  newCourse,
  newCourseItem,
  newCourseToken
};
