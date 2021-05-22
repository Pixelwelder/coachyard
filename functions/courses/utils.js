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
    displayName: `${original.displayName}`
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

const tokenUpdateFromCourse = (course) => {
  const timestamp = admin.firestore.Timestamp.now();

  return {
    courseUid: course.uid,
    created: timestamp,
    creatorUid: course.creatorUid,
    displayName: course.displayName,
    isPublic: course.isPublic,
    parent: course.parent,
    price: course.price,
    type: 'basic',
    updated: timestamp,
  }
};

const tokenFromCourse2 = (course, user, overrides = {}) => {
  const ref = admin.firestore().collection('tokens').doc();

  const data = {
    ...tokenUpdateFromCourse(course),
    access: 'student',
    type: 'basic',
    user: user.uid,
    userDisplayName: user.displayName,
    uid: ref.id,
    ...overrides
  };

  return { data, ref };
};

const getChildCourseUpdate = ({ displayName = '', description = '' } = {}) => ({
  displayName,
  description
});

/**
 * Filter out the junk.
 */
const filterCourseItem = (params) => {
  const paramNames = ['displayName', 'description', 'type', 'price', 'isPublic'];
  const courseItem = paramNames.reduce((accum, paramName) => {
    return params.hasOwnProperty(paramName) && params[paramName] !== null && params[paramName] !== undefined
      ? { ...accum, [paramName]: params[paramName ]}
      : accum;
  }, {});

  return courseItem;
};

module.exports = {
  cloneCourseData,
  createGetItem,
  tokenUpdateFromCourse,
  tokenFromCourse2,
  getChildCourseUpdate,
  filterCourseItem
};
