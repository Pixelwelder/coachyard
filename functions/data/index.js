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
  items: [],
  ...overrides
});

const newCourseItem = (overrides) => ({
  ...newBaseItem(),
  displayName: '',
  description: '',
  ...overrides
});

module.exports = {
  newUserMeta,
  newStudent,
  newInvite,
  newCourse,
  newCourseItem
};
