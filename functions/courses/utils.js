const admin = require('firebase-admin');

const cloneCourseData = (original) => {
  const ref = admin.firestore().collection('courses').doc();
  const timestamp = admin.firestore.Timestamp.now();
  const data = {
    ...original,
    uid: ref.id,
    parent: original.uid,
    created: timestamp,
    updated: timestamp,
    type: 'basic',
    itemOrder: [], // The clone will look to its parent for these.

    // TODO TEMP
    displayName: `${original.displayName} Copy`
  };

  return { ref, data };
};

const createGetItem = transaction => async (collection, uid) => {
  const ref = admin.firestore().collection(collection).doc(uid);
  const doc = await transaction.get(ref);
  if (!doc.exists) throw new Error(`No ${uid} in ${collection}.`);
  const data = doc.data();

  return { ref, data };
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
  cloneCourseData,
  createGetItem,
  tokenFromCourse2
};
