const newBaseItem = (overrides) => ({
  uid: '', // Always store the uid when created.
  created: '',
  updated: '',
  ...overrides
});

const newUserMeta = (overrides) => ({
  ...newBaseItem(),
  students: [],
  coursesEnrolled: [],
  ...overrides
});

// TODO - Remove.
const newStudent = (overrides) => ({
  ...newBaseItem(),
  email: '',
  ...overrides
});

const newInvite = (overrides) => ({
  ...newBaseItem(),
  teacherUid: '',
  teacherDisplayName: '',
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
  courseUid: '',
  displayName: '',
  description: '',
  streamingId: '',
  ...overrides
});

module.exports = {
  newUserMeta,
  newStudent,
  newInvite,
  newCourse,
  newCourseItem
};
