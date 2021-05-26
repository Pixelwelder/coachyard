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
    priceFrequency: course.priceFrequency,
    type: 'basic',
    updated: timestamp,
    user: user.uid,
    userDisplayName: user.displayName
  };
};

// Includes a doc ref.
const tokenFromCourse2 = (course, user, overrides = {}) => {
  const ref = admin.firestore().collection('tokens').doc();
  const data = {
    ...tokenFromCourse(course, user),
    uid: ref.id,
    ...overrides
  };

  return { data, ref };
};

module.exports = {
  tokenFromCourse,
  tokenFromCourse2
}
