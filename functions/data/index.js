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
  version: 3,
  email: '', // TODO Update this when the authUser updates.
  displayName: '',
  tier: 0,   // Temporary
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
  // Once this is cloned for a user, it becomes basic.
  type: 'basic', // template, basic
  price: 4995, // in cents
  parent: '',
  numChats: 0,
  numChatsUnseen: 0,
  itemOrder: [],      // Items that in this course plus all descendant courses.
  localItemOrder: [], // Items that are _only_ in this course. They are cloned for descendant courses.
  isPublic: false,
  ...overrides
});

const newCourseItem = (overrides) => ({
  ...newBaseItem(),
  creatorUid: '',
  courseUid: '',
  displayName: '',
  description: '',
  type: 'basic', // 'basic', 'template'
  parent: null,

  // This is for invites. TODO - Review.
  date: null,
  dateEnd: null,
  room: false,
  status: 'viewing', // pre-recorded, scheduled, initializing, live, uploading, processing, viewing
  started: false,
  length: 60, // in minutes

  // This is for associated media.
  originalFilename: '',
  streamingId: '',
  playbackId: '',
  streamingInfo: false,

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
  userDisplayName: '',
  courseUid: '',
  price: 0,
  access: 'student', // 'student' | 'editor' | 'admin'

  // Abbreviated Course
  displayName: '',
  parent: '',
  creatorUid: '',
  type: 'basic', // 'basic', 'template'
  isPublic: false,

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
