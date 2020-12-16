const newUserMeta = (overrides) => ({
  uid: '',
  created: '',
  updated: '',
  students: [],
  courses: [],
  ...overrides
});

const newStudent = (overrides) => ({
  uid: '',
  email: '',
  created: '',
  updated: '',
  ...overrides
});

const newInvite = (overrides) => ({
  created: '',
  updated: '',
  teacherUid: '',
  teacherDisplayName: '',
  email: '',
  displayName: '',
  time: '',
  ...overrides
});

module.exports = {
  newUserMeta,
  newStudent,
  newInvite
};
