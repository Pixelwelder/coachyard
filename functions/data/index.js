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
  newStudent,
  newInvite,
  newCourse,
  newCourseItem
};
