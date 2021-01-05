// TODO Factory method that handles timestamps.
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
  isAccepted: false,   // TODO Remove
  isCompleted: false,  // TODO Remove
  isInProgress: false, // TODO Remove
  status: 'viewing', // scheduled, live, processing, viewing

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
