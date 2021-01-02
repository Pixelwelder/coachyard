const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourse, newCourseItem } = require('../data');

const createCourse = async (data, context) => {
  try {
    checkAuth(context);

    const { auth: { token: { uid } } } = context;
    const { displayName, student, description = '', date } = data;

    // TODO Gate!
    const { course, item } = admin.firestore().runTransaction(async (transaction) => {
      // Do we have the student?
      const studentRef = await admin.firestore().collection('users')
        .where('student', '==', student);

      const studentDoc = await transaction.get(studentRef);
      console.log('found', studentDoc.size, 'student');

      // Create course object.
      const courseRef = admin.firestore().collection('courses').doc();
      const now = admin.firestore.Timestamp.now();
      const course = newCourse({
        uid: courseRef.id,
        creatorUid: uid,
        displayName,
        description,
        created: now,
        updated: now,

        // Save UID if we have it; otherwise email.
        student: studentDoc.size ? studentDoc.docs[0].data().uid : student
      });

      // Add it.
      await transaction.set(courseRef, course);

      // Now create the first item in the course.
      const itemRef = admin.firestore().collection('items').doc();
      const timestamp = admin.firestore.Timestamp.now();
      const item = newCourseItem({
        uid: itemRef.id,
        creatorUid: uid,
        courseUid: courseRef.id,
        created: timestamp,
        updated: timestamp,

        displayName: 'First Meeting',
        date,
        status: date ? 'scheduled' : 'viewing'
      });

      await transaction.set(itemRef, item);

      return { course, item }
    });

    return { message: `Course '${displayName}' created.`, course, item };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Filter out the junk.
 */
const filterCourseItem = ({
  displayName,
  description,
  student,
}) => {
  const courseItem = { displayName, description };

  // Don't change the student if there's nothing there. Could me there's a real student.
  if (student) courseItem.student = student;

  return courseItem;
};

const updateCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: courseUid, update } = data;

    console.log(data);

    const filteredCourseItem = filterCourseItem(update);

    // Do we need to find a user?
    const { student } = filteredCourseItem;
    let studentUser;
    if (student) {
      try {
        studentUser = await admin.auth().getUserByEmail(student);
        filteredCourseItem.student = studentUser.uid;
      } catch (error) {
        console.log(`No student ${student}.`);
      }
    }

    await admin.firestore().runTransaction(async (transaction) => {
      const ref = admin.firestore().collection('courses').doc(courseUid);
      const doc = await transaction.get(ref);
      const course = doc.data();
      if (course.creatorUid !== uid) throw new Error(`User ${uid} cannot update course ${course.uid}.`);

      await transaction.update(ref, filteredCourseItem);
    });

    console.log('Course updated.');
    return { message: 'Course updated.', course: data };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Allows one user to give a course they created to another user.
 *
 * @param data
 * @param context
 * @returns {Promise<{message: string}>}
 */
const giveCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { token: { uid } } } = context;
    const { courseUid, email } = data;

    const user = await admin.auth().getUserByEmail(email);
    if (!user) throw new Error(`No user with email ${email}.`);

    await admin.firestore().runTransaction(async (transaction) => {
      // Get the course.
      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);

      // See if the giver has the right to give it.
      const course = courseDoc.data();
      if (course.creatorUid !== uid) throw new Error(`Course was not created by ${uid}.`);

      const gifteeRef = admin.firestore().collection('users').doc(user.uid);
      const gifteeDoc = await transaction.get(gifteeRef);

      const giftee = gifteeDoc.data();
      if (giftee.enrolled[courseUid]) throw new Error(`User is already enrolled in course ${courseUid}.`);

      console.log('giving', giftee, courseUid);
      await transaction.update(gifteeRef, { enrolled: { ...giftee.enrolled, [courseUid]: true } });
    });

    return { message: `User ${email} now owns course ${courseUid}.`};

  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Utility function - asynchronously loads a user meta.
 * @private
 * @param uid
 */
// const _getUserMeta = async ({ uid }) => {
//   const doc = await admin.firestore().collection('users').doc(uid).get();
//   if (!doc.exists) throw new Error(`No user by uid ${uid}.`);
//
//   return { doc, data: doc.data() };
// };

/**
 * Utility function - tells us whether a user is cleared to load a course.
 * @private
 * @param userMeta
 * @param courseUid
 */
const _canGetCourse = ({ userMeta, course }) => {
  return course.creatorUid === userMeta.uid || !!userMeta.enrolled[course.uid];
};

/**
 * Utility function - asynchronously loads a course.
 * @private
 * @param userMeta - the user meta of the user who wishes to load the course
 * @param courseUid - the id of the course to load
 * @param doCheck - whether we should check if the user is allowed
 */
// const _getCourse = async ({ userMeta, courseUid, doCheck = true }) => {
//   console.log('_getCourse', courseUid);
//   if (doCheck) {
//     if (!_canGetCourse({ userMeta, courseUid })) throw new Error(`User ${userMeta.uid} cannot get course ${courseUid}`)
//   }
//
//   const doc = await admin.firestore().collection('courses').doc(courseUid).get();
//   if (!doc.exists) throw new Error(`Course ${courseUid} does not exist.`);
//
//   return { doc, data: doc.data() };
// };

/**
 * Gets a specific course.
 * @param.uid - the id of the course to return
 */
const getCourse = async (data, context) => {
  try {
    checkAuth(context);

    console.log('getCourse', data);

    const { course, items } = await admin.firestore().runTransaction(async (transaction) => {
      const { auth: { uid } } = context;

      // Grab the user.
      const userRef = admin.firestore().collection('users').doc(uid);
      const userDoc = await transaction.get(userRef);
      const userMeta = userDoc.data();
      console.log('user', userMeta);

      // Grab the course.
      const courseRef = admin.firestore().collection('courses').doc(data.uid);
      const courseDoc = await transaction.get(courseRef);
      const course = courseDoc.data();
      console.log('course', course);

      // Does the user have access?
      if (!_canGetCourse({ userMeta, course })) throw new Error(`User ${uid} can't get course ${data.uid}.`);

      // Now grab the items in the course.
      const itemsRef = admin.firestore().collection('items')
        .where('courseUid', '==', data.uid );
      const itemsDoc = await transaction.get(itemsRef);
      const items = itemsDoc.docs.map(item => item.data());

      return { course, items };
    });

    return { course, items };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Deletes a specific course AND all its items.
 * @param.uid - the id of the course to delete
 */
const deleteCourse = async (data, context) => {
  try {
    checkAuth(context);

    // const { data: course, doc } = await _getCourse({ courseUid: data.uid, doCheck: false });
    // if (course.creatorUid !== context.auth.uid) throw new Error(`User ${context.auth.uid} did not create ${data.uid}.`);

    const { auth: { uid } } = context;

    const { items } = await admin.firestore().runTransaction(async (transaction) => {
      const courseRef = admin.firestore().collection('courses').doc(data.uid);
      const courseDoc = await transaction.get(courseRef);
      const course = courseDoc.data();
      if (course.creatorUid !== uid) throw new Error(`User ${uid} did not create ${data.uid}.`);

      const itemsRef = admin.firestore().collection('items')
        .where('courseUid', '==', data.uid);
      const itemsDocs = await transaction.get(itemsRef);

      console.log(`found ${itemsDocs.size} items`);
      transaction.delete(courseRef);

      // Should this be async?
      const items = itemsDocs.docs.map(doc => doc.data());
      itemsDocs.docs.forEach(doc => { transaction.delete(doc.ref); });

      return { items };
    });

    // Now delete from streaming server.
    // TODO Move this into a listener.
    const promises = items.map(async item => {
      const { streamingId } = item;
      console.log('deleting', streamingId);
      const result = await fetch(
        `https://api.mux.com/video/v1/assets/${streamingId}`,
        {
          method: METHODS.DELETE,
          headers: getMuxHeaders()
        }
      );
      console.log(result);
    });

    await Promise.all(promises);

    console.log(`Deleted ${items.length}.`);

    // Now remove it from the user.
    // const { doc: userDoc, data: { coursesCreated } } = await _getUserMeta({ uid: context.auth.uid });
    // const filteredCourses = coursesCreated.filter(courseUid => courseUid !== data.uid);
    // await userDoc.ref.update({ coursesCreated: filteredCourses, updated: admin.firestore.Timestamp.now() });

    // Done.
    return { message: `Course ${data.uid} and ${items.length} items deleted.` };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Gets the courses created by the signed-in user.
 */
const getCreatedCourses = async (data, context) => {
  try {
    checkAuth(context);

    const { auth: { token: { uid } } } = context;
    const snapshot = await admin.firestore()
      .collection('courses').where('creatorUid', '==', uid)
      .get();

    const courses = snapshot.docs.map(doc => doc.data());

    console.log(courses.length, 'found');
    return courses;
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  // Courses
  createCourse: functions.https.onCall(createCourse),
  updateCourse: functions.https.onCall(updateCourse),
  getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  // updateCourse: functions.https.onCall(updateCourse),
  // giveCourse: functions.https.onCall(giveCourse),
  // getAllCourses: functions.https.onCall(getAllCourses),
  // getCreatedCourses: functions.https.onCall(getCreatedCourses)
};
