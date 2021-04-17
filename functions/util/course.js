const admin = require('firebase-admin');

const tokenFromCourse = (course, user) => {
  const timestamp = admin.firestore.Timestamp.now();
  return {
    access: 'student',
    courseUid: course.uid,
    created: timestamp,
    creatorUid: course.creatorUid,
    displayName: course.displayName,
    parent: course.parent,
    price: course.price,
    type: 'basic',
    updated: timestamp,
    user: user.uid,
    userDisplayName: user.displayName
  };
};

const tokenFromCourse2 = (course, user, overrides = {}) => {
  const ref = admin.firestore().collection('tokens').doc();
  const timestamp = admin.firestore.Timestamp.now();
  const data = {
    access: 'student',
    courseUid: course.uid,
    created: timestamp,
    creatorUid: course.creatorUid,
    displayName: course.displayName,
    parent: course.parent,
    price: course.price,
    type: 'basic',
    updated: timestamp,
    user: user.uid,
    userDisplayName: user.displayName,
    uid: ref.id,
    ...overrides
  };

  return { data, ref };
};

module.exports = {
  tokenFromCourse,
  tokenFromCourse2
}
