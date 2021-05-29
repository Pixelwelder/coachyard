const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { uploadImage } = require('../util/images');
const { cloneCourseData, createGetItem, tokenFromCourse2 } = require('./utils');

const _unlockCourse = async ({ courseDoc, studentUid }) => {

  await admin.firestore().runTransaction(async (transaction) => {
    // This is a real problem; the student has paid twice.
    const tokenCheck = await admin.firestore().collection('tokens')
      .where('courseUid', '==', courseDoc.id)
      .where('user', '==', studentUid);
    if (tokenCheck.exists) throw new Error(`${studentUid} already has access to ${courseDoc.id}.`);

    const course = courseDoc.data();

    const studentRef = admin.firestore().collection('users').doc(studentUid);
    const studentDoc = await transaction.get(studentRef);
    const student = studentDoc.data();

    // Create a new token.
    const { ref, data } = tokenFromCourse2(course, student);
    await transaction.set(ref, data);
    return course;
  });
};

const _cloneCourse2 = async ({ courseDoc, studentUid }) => {
  console.log('cloning...');
  const clonedCourse = await admin.firestore().runTransaction(async (transaction) => {
    const course = courseDoc.data();
    // Bail early if student already owns a descendant of this course.
    // This is a real problem because the student has just paid for it again.
    const token = await admin.firestore().collection('tokens')
      .where('parent', '==', course.uid).get();
    if (token.exists) throw new Error(`${studentUid} already owns a descendant of ${course.uid}.`);

    // Grab the student, the teacher, and the course items.
    const getData = createGetItem(transaction);
    const student = await getData('users', studentUid);
    const teacher = await getData('users', course.creatorUid);
    const originalItemDocs = await transaction.get(courseDoc.ref.collection('items').where('type', '==', 'template'));

    // Create the new course.
    const newCourse = cloneCourseData(course);

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

    // Update payment session.


    await Promise.all(itemWrites);

    return newCourse.data;
  });

  // Add a course image.
  await uploadImage({
    path: './courses/generic-teacher-cropped.png',
    destination: `courses/${clonedCourse.uid}`
  });

  console.log('cloning complete');

  // Return the new course to the front end.
  return clonedCourse;
};

const unlockCourse = async (object) => {
  const { id, metadata: { studentUid, courseUid }} = object;
  console.log('unlocking course', studentUid, courseUid);

  const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
  const course = courseDoc.data();

  if (course.type === 'template') {
    return _cloneCourse2({ courseDoc, studentUid });
  } else {
    return _unlockCourse({ courseDoc, studentUid });
  }
};

module.exports = {
  unlockCourse
};
