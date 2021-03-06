const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourse, newCourseItem, newCourseToken } = require('../data');

const createCourse = async (data, context) => {
  try {
    log({ message: 'Attempting to create course...', data, context });
    checkAuth(context);

    const { auth: { token: { uid, email, name: teacherName } } } = context;
    const { displayName, type, students: _students, description = '', date, image = '' } = data;

    // This is an array of emails.
    const students = _students ? _students.split(',').map(s => s.trim().toLowerCase()) : [];

    const { course, item } = admin.firestore().runTransaction(async (transaction) => {

      // For all students that exist, replace the email with their uid.
      const studentPromises = students.map(student => {
        const ref = admin.firestore().collection('users').where('email', '==', student);
        return transaction.get(ref);
      });

      const studentResults = await Promise.all(studentPromises).catch(error => {
        log({ message: error.message, data: error, context, level: 'error' });
      });
      const studentsById = studentResults.reduce((accum, result) => {
        if (!result.size) return accum;

        const data = result.docs[0].data();
        return { ...accum, [data.uid]: data };
      }, {});
      const studentUids = studentResults.map(result => {
        return result.size ? result.docs[0].data().uid : null
      });

      // Create course object.
      const courseRef = admin.firestore().collection('courses').doc();
      const timestamp = admin.firestore.Timestamp.now();
      const course = newCourse({
        uid: courseRef.id,
        creatorUid: uid,
        displayName,
        description,
        type,
        created: timestamp,
        updated: timestamp
      });

      // Add it.
      await transaction.set(courseRef, course);

      // Now create the first item in the course.
      // TODO Move this into a handler if possible... though date is tricky.
      const itemRef = admin.firestore().collection('items').doc();
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

      // Now create access tokens.
      const teacherTokenRef = admin.firestore().collection('tokens').doc();
      const teacherToken = newCourseToken({
        uid: teacherTokenRef.id,
        created: timestamp,
        updated: timestamp,
        user: uid,
        userDisplayName: teacherName,
        courseUid: courseRef.id,
        access: 'admin',
        displayName,
        description,
        image
      });

      await transaction.create(teacherTokenRef, teacherToken)

      const studentTokenPromises = students.map((studentEmail, index) => {
        if (studentEmail === email) {
          log({ message: `Cannot take your own course. Skipping ${studentEmail}.`, data, context });
          return null;
        }

        const studentTokenRef = admin.firestore().collection('tokens').doc();
        const studentUid = studentUids[index];
        const student = studentsById[studentUid];
        const studentToken = newCourseToken({
          uid: studentTokenRef.id,
          created: timestamp,
          updated: timestamp,
          user: studentUid || studentEmail,
          userDisplayName: student ? student.displayName : studentEmail,
          courseUid: courseRef.id,
          access: 'student',
          displayName,
          description,
          image
        });

        return transaction.set(studentTokenRef, studentToken);
      });

      await Promise.all(studentTokenPromises.filter(promise => !!promise)).catch(error => {
        log({ message: error.message, data: error, context, level: 'error' });
      });
    });

    log({ message: `Course created.`, data: item, context });
    return { message: `Course '${displayName}' created.`, course, item };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Filter out the junk.
 */
const filterCourseItem = (params) => {
  const paramNames = ['displayName', 'description', 'type', 'price'];
  const courseItem = paramNames.reduce((accum, paramName) => {
    return params.hasOwnProperty(paramName) && params[paramName] !== null && params[paramName] !== undefined
      ? { ...accum, [paramName]: params[paramName ]}
      : accum;
  }, {});

  return courseItem;
};

const updateCourse = async (data, context) => {
  try {
    log({ message: 'Attempting to update course...', data, context });
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: courseUid, update } = data;

    const filteredCourseItem = filterCourseItem(update);
    console.log('fiteredCourseItem', update, filteredCourseItem);

    // Do we need to find a user?
    const { student } = filteredCourseItem;
    let studentUser;
    if (student) {
      try {
        studentUser = await admin.auth().getUserByEmail(student);
        filteredCourseItem.student = studentUser.uid;
      } catch (error) {
        log({ message: `No student ${student}.`, data, context });
      }
    }

    await admin.firestore().runTransaction(async (transaction) => {
      const ref = admin.firestore().collection('courses').doc(courseUid);
      const doc = await transaction.get(ref);
      const course = doc.data();
      if (course.creatorUid !== uid) throw new Error(`User ${uid} cannot update course ${course.uid}.`);

      await transaction.update(ref, filteredCourseItem);
    });

    log({ message: 'Course successfully updated.', data, context });
    return { message: 'Course updated.', course: data };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const addUser = async (data, context) => {
  try {
    checkAuth(context);
    const { courseUid, studentEmail } = data;
    console.log(data);

    await admin.firestore().runTransaction(async (transaction) => {
      // Grab the course.
      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);
      const { displayName, description, image } = courseDoc.data();

      // Grab the student.
      const studentRef = admin.firestore()
        .collection('users')
        .where('email', '==', studentEmail)
        .limit(1);
      const studentDocs = await transaction.get(studentRef);
      let student;
      let studentUid;
      if (studentDocs.size) {
        student = studentDocs.docs[0].data();
        studentUid = studentDocs.docs[0].id;
      }
      console.log('student', studentUid, student);

      // Check to make sure token doesn't already exist.
      const existingTokenRef = admin.firestore().collection('tokens')
        .where('courseUid', '==', courseUid)
        .where('user', '==', studentUid || studentEmail)
        .limit(1);
      const existingTokenDoc = await transaction.get(existingTokenRef);
      if (existingTokenDoc.size) throw new Error(`User ${studentUid || studentEmail} already has access to ${courseUid}.`);

      const tokenRef = admin.firestore().collection('tokens').doc();
      const timestamp = admin.firestore.Timestamp.now()
      const studentToken = newCourseToken({
        uid: tokenRef.id,
        created: timestamp,
        updated: timestamp,
        user: studentUid || studentEmail,
        userDisplayName: student ? student.displayName : studentEmail,
        courseUid,
        access: 'student',
        displayName,
        description,
        image
      });

      await transaction.set(tokenRef, studentToken);
    });

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const removeUser = async (data, context) => {
  try {
    checkAuth(context);
    const { tokenUid } = data;
    const result = await admin.firestore().runTransaction(async (transaction) => {

      const tokenRef = admin.firestore().collection('tokens').doc(tokenUid);
      const tokenDoc = await transaction.get(tokenRef);
      if (!tokenDoc.exists) throw new Error(`Token ${tokenUid} does not exist.`);

      await transaction.delete(tokenRef);
    });
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const purchaseCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { courseUid } = data;
    const {
      auth: {
        uid,
        token: { name: userDisplayName }
      }
    } = context;
    console.log('student', userDisplayName, courseUid);

    const result = await admin.firestore().runTransaction(async (transaction) => {
      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);
      const { displayName, description, image } = courseDoc.data();

      // const studentRef = admin.firestore().collection('users').doc(uid);
      // const studentDoc = await transaction.get(studentRef);
      // if (!studentDoc.exists) throw new Error(`Student ${uid} does not exist.`);
      // const { displayName: userDisplayName } = studentDoc.data();

      const tokenRef = admin.firestore().collection('tokens').doc();
      const timestamp = admin.firestore.Timestamp.now()
      const studentToken = newCourseToken({
        uid: tokenRef.id,
        created: timestamp,
        updated: timestamp,
        user: uid,
        userDisplayName,
        courseUid,
        access: 'student',
        displayName,
        description,
        image
      });

      console.log('setting');
      await transaction.set(tokenRef, studentToken);
    });

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Allows one user to give a course they created to another user.
 * TODO - Must be rewritten
 *
 * @param data
 * @param context
 * @returns {Promise<{message: string}>}
 */
// const giveCourse = async (data, context) => {
//   try {
//     checkAuth(context);
//     const { auth: { token: { uid } } } = context;
//     const { courseUid, email } = data;
//
//     const user = await admin.auth().getUserByEmail(email);
//     if (!user) throw new Error(`No user with email ${email}.`);
//
//     await admin.firestore().runTransaction(async (transaction) => {
//       // Get the course.
//       const courseRef = admin.firestore().collection('courses').doc(courseUid);
//       const courseDoc = await transaction.get(courseRef);
//       if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);
//
//       // See if the giver has the right to give it.
//       const course = courseDoc.data();
//       if (course.creatorUid !== uid) throw new Error(`Course was not created by ${uid}.`);
//
//       const gifteeRef = admin.firestore().collection('users').doc(user.uid);
//       const gifteeDoc = await transaction.get(gifteeRef);
//
//       const giftee = gifteeDoc.data();
//       if (giftee.enrolled[courseUid]) throw new Error(`User is already enrolled in course ${courseUid}.`);
//
//       console.log('giving', giftee, courseUid);
//       await transaction.update(gifteeRef, { enrolled: { ...giftee.enrolled, [courseUid]: true } });
//     });
//
//     return { message: `User ${email} now owns course ${courseUid}.`};
//
//   } catch (error) {
//     console.error(error);
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
// };

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

// /**
//  * Gets a specific course.
//  * @param.uid - the id of the course to return
//  */
// const getCourse = async (data, context) => {
//   try {
//     log({ message: 'Attempting to get course...', data, context });
//     checkAuth(context);
//
//     const { course, items } = await admin.firestore().runTransaction(async (transaction) => {
//       const { auth: { uid } } = context;
//
//       // Grab the user.
//       const userRef = admin.firestore().collection('users').doc(uid);
//       const userDoc = await transaction.get(userRef);
//       const userMeta = userDoc.data();
//
//       // Grab the course.
//       const courseRef = admin.firestore().collection('courses').doc(data.uid);
//       const courseDoc = await transaction.get(courseRef);
//       const course = courseDoc.data();
//
//       // Does the user have access?
//       if (!_canGetCourse({ userMeta, course })) throw new Error(`User ${uid} can't get course ${data.uid}.`);
//
//       // Now grab the items in the course.
//       const itemsRef = admin.firestore().collection('items')
//         .where('courseUid', '==', data.uid );
//       const itemsDoc = await transaction.get(itemsRef);
//       const items = itemsDoc.docs.map(item => item.data());
//
//       return { course, items };
//     });
//
//     return { course, items };
//   } catch (error) {
//     log({ message: error.message, data: error, context, level: 'error' });
//     throw new functions.https.HttpsError('internal', error.message, error);
//   }
// };

/**
 * Deletes a specific course AND all its items.
 * @param.uid - the id of the course to delete
 */
const deleteCourse = async (data, context) => {
  try {
    log({ message: 'Attempting to delete course...', data, context });
    checkAuth(context);

    // const { data: course, doc } = await _getCourse({ courseUid: data.uid, doCheck: false });
    // if (course.creatorUid !== context.auth.uid) throw new Error(`User ${context.auth.uid} did not create ${data.uid}.`);

    const { auth: { uid } } = context;

    const result = await admin.firestore().runTransaction(async (transaction) => {
      const { uid: courseUid } = data;

      const courseRef = admin.firestore().collection('courses').doc(courseUid);
      const courseDoc = await transaction.get(courseRef);
      const course = courseDoc.data();
      if (course.creatorUid !== uid) throw new Error(`User ${uid} did not create ${courseUid}.`);

      transaction.delete(courseRef);
    });

    // Done.
    log({ message: 'Successfully deleted course', data, context });
    return { message: `Course ${data.uid} deleted.` };
  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const onCourseUpdated = functions.firestore
  .document('/courses/{docId}')
  .onUpdate(async (change, context) => {
    const { docId } = context.params;
    log({ message: `Course ${docId} was updated.`, data: change.after.data(), context });

    // Update all tokens.
    const result = await admin.firestore().runTransaction((async (transaction) => {
      try {
        const { displayName, description, image, uid } = change.after.data();
        const tokensRef = admin.firestore()
          .collection('tokens')
          .where('courseUid', '==', uid)
          .select();

        const tokens = await transaction.get(tokensRef);
        const promises = tokens.docs.map((doc) => {
          return transaction.update(doc.ref, {
            displayName,
            description,
            image
          })
        });

        await Promise.all(promises).catch(error => {
          log({ message: error.message, data: error, context, level: 'error' });
        });
      } catch (error) {
        log({ message: error.message, data: change.after.data(), context, level: 'error' });
      }
    }));
  });

const onCourseDeleted = functions.firestore
  .document('/courses/{docId}')
  .onDelete(async (change, context) => {
    const { docId } = context.params;
    log({ message: `Course ${docId} was deleted.`, context });

    // Delete all tokens.
    const { uid } = change.data();

    const { streamingIds } = await admin.firestore().runTransaction(async (transaction) => {
      try {
        const tokensRef = admin.firestore()
          .collection('tokens')
          .where('courseUid', '==', uid)
        const tokens = await transaction.get(tokensRef);

        const itemsRef = admin.firestore()
          .collection('items')
          .where('courseUid', '==', uid)
        const items = await transaction.get(itemsRef);

        // Delete tokens.
        const tokenPromises = tokens.docs.map((doc) => transaction.delete(doc.ref));

        // Delete items, saving streamingIds for the last step.
        const { promises: itemPromises, streamingIds } = items.docs.reduce((accum, doc) => {
          const item = doc.data();
          const newAccum = {
            promises: [...accum.promises, transaction.delete(doc.ref)],
            streamingIds: [...accum.streamingIds]
          };

          if (item.streamingId) newAccum.streamingIds.push(item.streamingId);

          return newAccum;
        }, { promises: [], streamingIds: [] });

        await Promise.all([...tokenPromises, itemPromises]).catch(error => {
          log({ message: error.message, data: error, context, level: 'error' });
        });
        log({ message: `Deleted ${tokenPromises.length} tokens and ${itemPromises.length} items.`, context });

        return { streamingIds };
      } catch (error) {
        log({ message: error.message, data: error, context, level: 'error' });
      }
    });

    // Now delete from streaming server.
    const promises = streamingIds.map(async (streamingId) => {
      const result = await fetch(
        `https://api.mux.com/video/v1/assets/${streamingId}`,
        {
          method: METHODS.DELETE,
          headers: getMuxHeaders()
        }
      );

      // TODO No way to know.
    });

    await Promise.all(promises).catch(error => {
      log({ message: error.message, data: error, context, level: 'error' });
    });
    log({ message: `Deleted ${promises.length} items from streaming server.`, context });
  });


module.exports = {
  // Courses
  createCourse: functions.https.onCall(createCourse),
  updateCourse: functions.https.onCall(updateCourse),
  // getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  addUser: functions.https.onCall(addUser),
  removeUser: functions.https.onCall(removeUser),
  purchaseCourse: functions.https.onCall(purchaseCourse),
  // updateCourse: functions.https.onCall(updateCourse),
  // giveCourse: functions.https.onCall(giveCourse),
  // getAllCourses: functions.https.onCall(getAllCourses),
  // getCreatedCourses: functions.https.onCall(getCreatedCourses),
  onCourseUpdated,
  onCourseDeleted
};
