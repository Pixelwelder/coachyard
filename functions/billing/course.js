const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { tokenFromCourse, tokenFromCourse2 } = require('../util/course');
const { uploadImage } = require('../courses/images');
const { checkAuth } = require('../util/auth');

const _unlockCourse = async (data, context) => {
  const { courseUid } = data;
  const {
    auth: {
      uid,
      token: { name: userDisplayName }
    }
  } = context;

  await admin.firestore().runTransaction(async (transaction) => {
    const courseRef = admin.firestore().collection('courses').doc(courseUid);
    const courseDoc = await transaction.get(courseRef);
    if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);
    const course = courseDoc.data();

    const tokenRef = admin.firestore().collection('tokens').doc();
    const studentToken = {
      ...tokenFromCourse(course, { uid, displayName: userDisplayName }),
      access: 'student',
      uid: tokenRef.id
    };

    await transaction.set(tokenRef, studentToken);
    return course;
  });
};

const createGetItem = transaction => async (collection, uid) => {
  const ref = admin.firestore().collection(collection).doc(uid);
  const doc = await transaction.get(ref);
  if (!doc.exists) throw new Error(`No ${uid} in ${collection}.`);
  const data = doc.data();

  return { ref, data };
};

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

const _cloneCourse2 = async (data, context) => {
  const { courseUid, studentUid } = data;
  const course = await admin.firestore().runTransaction(async (transaction) => {
    // Bail early if student already owns a descendant of this course.
    const token = await admin.firestore().collection('tokens')
      .where('parent', '==', courseUid).get();
    if (token.exists) throw new Error(`${studentUid} already owns a descendant of ${courseUid}.`);

    // Grab the course, the student, the teacher, and the course items.
    const getData = createGetItem(transaction);
    const original = await getData('courses', courseUid);
    const student = await getData('users', studentUid);
    const teacher = await getData('users', original.data.creatorUid);
    const originalItemDocs = await transaction.get(original.ref.collection('items').where('type', '==', 'template'));

    // Create the new course.
    const newCourse = cloneCourseData(original.data);

    // Create access tokens: teacher and student.
    const studentToken = tokenFromCourse2(newCourse.data, student.data);
    const teacherToken = tokenFromCourse2(newCourse.data, teacher.data, { access: 'admin' });

    // Perform all writes: new course plus two tokens.
    await transaction.set(newCourse.ref, newCourse.data);
    await transaction.set(studentToken.ref, studentToken.data);
    await transaction.set(teacherToken.ref, teacherToken.data);

    // Create the new items for the course.
    const oldItemsById = originalItemDocs.docs.reduce((accum, doc) => {
      return { ...accum, [doc.id]: doc.data() }
    }, {});
    const itemWrites = newCourse.data.localItemOrder.map((uid) => {
      const oldItem = oldItemsById[uid];
      const newItem = { ...oldItem, type: 'basic', parent: oldItem.uid }; // TODO Remove 'parent'?
      const newRef = newCourse.ref.collection('items').doc(uid); // Same ID as old one.
      return transaction.set(newRef, newItem);
    });

    await Promise.all(itemWrites);

    return newCourse.data;
  });

  // Add a course image.
  await uploadImage({
    path: './courses/generic-teacher-cropped.png',
    destination: `courses/${course.uid}.png`
  });

  // Return the new course to the front end.
  return course;
};

const purchaseCourse = async (data, context) => {
  // try {
  checkAuth(context);
  const { courseUid } = data;
  const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
  if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);

  const course = courseDoc.data();
  if (course.type === 'template') {
    return _cloneCourse2(data, context);
  } else {
    return _unlockCourse(data, context);
  }

  // } catch (error) {
  //   log({ message: error.message, data: error, context, level: 'error' });
  //   throw new functions.https.HttpsError('internal', error.message, error);
  // }
};

module.exports = {
  purchaseCourse: functions.https.onCall(purchaseCourse),
};
