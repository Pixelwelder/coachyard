// TODO Copy of backend version.
const version = 5;

// TODO Factory method that handles timestamps.
const newBaseItem = (overrides) => ({
  version,
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
  email: '', // TODO Update this when the authUser updates.
  displayName: '',
  description: '',
  slug: '',

  claims: {
    remaining: 0,
    subscribed: false,
    tier: 0
  },

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

const newCourse = (overrides) => ({
  ...newBaseItem(),
  creatorUid: '',
  displayName: '',
  description: '',
  // Once this is cloned for a user, it becomes basic.
  type: 'basic', // template, basic
  price: 4995, // in cents
  priceFrequency: 'one-time', // one-time, month
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

  // Attached assets
  attachments: [],

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
  priceFrequency: '', // @see course
  access: 'student', // 'student' | 'editor' | 'admin'

  // Abbreviated Course
  displayName: '',
  parent: '',
  creatorUid: '',
  type: 'basic', // 'basic', 'template'
  isPublic: false,

  ...overrides
});

const newAttachment = (overrides) => ({
  ...newBaseItem(),
  displayName: '',
  description: '',
  ...overrides
});

const unitConverter = item => item;

// Maps types (collections) to constructors.
const constructorMap = {
  courses: newCourse,
  easy_customers: unitConverter,
  easy_providers: unitConverter,
  items: newCourseItem(),
  stripe_customers: newStripeCustomer,
  stripe_events: unitConverter,
  tokens: newCourseToken,
  users: newUserMeta
};

module.exports = {
  version,
  constructorMap,
  newUserMeta,
  newStripeCustomer,
  newStripePayment,
  newCourse,
  newCourseItem,
  newCourseToken,
  newAttachment
};
