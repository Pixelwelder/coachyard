const newBaseItem = (overrides) => ({
  created: '',
  updated: '',
  ...overrides
});

const newUserMeta = (overrides) => ({
  ...newBaseItem(),
  uid: '',
  students: [],
  coursesCreated: [],
  coursesEnrolled: [],
  ...overrides
});

const newStudent = (overrides) => ({
  ...newBaseItem(),
  uid: '',
  email: '',
  ...overrides
});

const newInvite = (overrides) => ({
  ...newBaseItem(),
  teacherUid: '',
  teacherDisplayName: '',
  email: '',
  displayName: '',
  time: '',
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
  firebaseId: '',
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
