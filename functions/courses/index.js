const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const { getMuxHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');
const { newCourse, newCourseItem, newCourseToken } = require('../data');
const { uploadImage } = require('./images');
const { initializePurchase } = require('./initializePurchase');
const stripe = require('../billing/stripe');

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

/**
 * A simpler createCourse.
 * @param data.displayName
 * @param data.type - see data/newCourse()
 */
const createCourse2 = async (data, context) => {
  try {
    log({ message: 'Attempting to create course...', data, context });
    checkAuth(context);

    const { auth: { token: { uid, email, name: teacherName } } } = context;
    const { displayName, type } = data;

    const course = await admin.firestore().runTransaction(async (transaction) => {
      // Add a course object to the database.
      const courseRef = admin.firestore().collection('courses').doc();
      const timestamp = admin.firestore.Timestamp.now();
      const course = newCourse({
        uid: courseRef.id,
        creatorUid: uid,
        displayName,
        type,
        created: timestamp,
        updated: timestamp
      });
      await transaction.set(courseRef, course);

      // Now add the teacher's token to the database.
      const teacherTokenRef = admin.firestore().collection('tokens').doc();
      const teacherToken = {
        ...tokenFromCourse(course, { uid, displayName: teacherName }),
        access: 'admin',
        uid: teacherTokenRef.id,
        courseUid: courseRef.id,
        type
      };
      await transaction.create(teacherTokenRef, teacherToken);

      return course;
    });

    // Don't really need to wait for this.
    await uploadImage({
      path: './courses/generic-teacher-cropped.png',
      destination: `courses/${course.uid}.png`
    });

    return course;
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

const getChildCourseUpdate = ({ displayName = '', description = '' } = {}) => ({
  displayName,
  description
});

const updateCourse = async (data, context) => {
  try {
    log({ message: 'Attempting to update course...', data, context });
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: courseUid, update } = data;

    const filteredCourseItem = filterCourseItem(update);

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

      // We also need to update all descendants.
      // TODO This is not very scalable.
      const childCourses = await transaction.get(
        admin.firestore().collection('courses').where('parent', '==', ref.id)
      );

      if (childCourses.size) {
        console.log(`Updating ${childCourses.size} child courses...`);
        if (childCourses.size > 450) log({ message: 'updateCourse: Too many children!', data, context, level: 'warning' });
        const childUpdate = getChildCourseUpdate(update);
        await childCourses.docs.map(async (courseDoc) => {
          await transaction.update(courseDoc.ref, childUpdate);
        });
      }

      // Now update the central course.
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
      const course = courseDoc.data();
      const { displayName, image, creatorUid } = course;

      // Grab the student.
      const studentRef = admin.firestore()
        .collection('users')
        .where('email', '==', studentEmail)
        .limit(1);
      const studentDocs = await transaction.get(studentRef);
      const student = studentDocs.size
        ? studentDocs.docs[0].data()
        : { uid: studentEmail, displayName: studentEmail };

      // Check to make sure token doesn't already exist.
      const existingTokenRef = admin.firestore().collection('tokens')
        .where('courseUid', '==', courseUid)
        .where('user', '==', student.uid)
        .limit(1);
      const existingTokenDoc = await transaction.get(existingTokenRef);
      if (existingTokenDoc.size) throw new Error(`User ${studentEmail} already has access to ${courseUid}.`);

      const tokenRef = admin.firestore().collection('tokens').doc();
      const studentToken = {
        ...tokenFromCourse(course, student),
        access: 'student',
        uid: tokenRef.id
      };

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

    // const studentRef = admin.firestore().collection('users').doc(uid);
    // const studentDoc = await transaction.get(studentRef);
    // if (!studentDoc.exists) throw new Error(`Student ${uid} does not exist.`);
    // const { displayName: userDisplayName } = studentDoc.data();

    const tokenRef = admin.firestore().collection('tokens').doc();
    const studentToken = {
      ...tokenFromCourse(course, { uid, displayName: userDisplayName }),
      access: 'student',
      uid: tokenRef.id
    };
    // const studentToken = newCourseToken({
    //   uid: tokenRef.id,
    //   created: timestamp,
    //   updated: timestamp,
    //   user: uid,
    //   userDisplayName,
    //   courseUid,
    //   access: 'student',
    //   creatorUid
    // });

    await transaction.set(tokenRef, studentToken);
    return course;
  });
};

const purchaseCourse = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { uid: courseUid } = data;
    console.log('checking course', courseUid);
    const courseDoc = await admin.firestore().collection('courses').doc(courseUid).get();
    if (!courseDoc.exists) throw new Error(`Course ${courseUid} does not exist.`);

    const course = courseDoc.data();
    console.log('got course', course);

    // Make sure this user does not already have access.
    console.log('checking tokens');
    const tokenDocs = await admin.firestore().collection('tokens')
      .where('courseUid', '==', courseUid)
      .where('user', '==', uid).get();
    if (tokenDocs.size) throw new Error(`User ${uid} already owns ${courseUid}.`);

    // Actually purchase it. Assumes we already have a payment method.
    // Grab the customer.
    console.log('Getting Stripe customer');
    const customerDoc = await admin.firestore().collection('stripe_customers').doc(uid).get();
    if (!customerDoc.exists) throw new Error(`Customer ${uid} doesn't exist.`);
    const customer = customerDoc.data();
    console.log('got Stripe customer');

    // TODO For now we are assuming there is only one payment method.
    const paymentMethodDocs = await customerDoc.ref.collection('payment_methods').limit(1).get();
    if (!paymentMethodDocs.size) throw new Error(`No payment method for customer ${uid}`);
    const paymentMethodDoc = paymentMethodDocs.docs[0];
    const paymentMethod = paymentMethodDoc.data();
    console.log('got Stripe payment method');

    console.log('making payment...');
    const result = await stripe.paymentIntents.create({
      amount: course.price,
      currency: 'usd',
      payment_method: paymentMethodDoc.id,
      customer: customer.customer_id,
      description: `Purchase: ${course.displayName}`,
      metadata: { creatorUid: course.creatorUid },
      statement_descriptor_suffix: course.displayName.slice(0, 22)
    });

    console.log('payment complete:', result);
    const doc = customerDoc.ref.collection('payments').doc();
    doc.set({ ...result, uid: doc.id });

    if (course.type === 'template') {
      return _cloneCourse2(data, context);
    } else {
      return _unlockCourse(data, context);
    }

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

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

      // Currently, the user can't delete a course that has children.
      const childrenRef = admin.firestore().collection('courses')
        .where('parent', '==', courseUid);
      const childrenDocs = await transaction.get(childrenRef);
      if (childrenDocs.size) throw new Error('Cannot delete a course that has already been purchased.');

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

    // Update all tokens if necessary.
    const before = change.before.data();
    const after = change.after.data();
    const updateRequired = ['displayName', 'description', 'price'].find(key => before[key] !== after[key]);
    if (!updateRequired) {
      console.log('No update required.');
      return;
    }

    await admin.firestore().runTransaction((async (transaction) => {
      try {
        const { displayName, description, price, uid } = change.after.data();
        const tokensRef = admin.firestore()
          .collection('tokens')
          .where('courseUid', '==', uid)
          .select();

        const tokens = await transaction.get(tokensRef);
        const promises = tokens.docs.map((doc) => {
          return transaction.update(doc.ref, {
            displayName,
            description,
            price
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
          .collection('courses').doc(docId)
          .collection('items');
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
  // createCourse: functions.https.onCall(createCourse),
  createCourse2: functions.https.onCall(createCourse2),
  updateCourse: functions.https.onCall(updateCourse),
  // getCourse: functions.https.onCall(getCourse),
  deleteCourse: functions.https.onCall(deleteCourse),
  addUser: functions.https.onCall(addUser),
  removeUser: functions.https.onCall(removeUser),
  initializePurchase: functions.https.onCall(initializePurchase),
  // updateCourse: functions.https.onCall(updateCourse),
  // giveCourse: functions.https.onCall(giveCourse),
  // getAllCourses: functions.https.onCall(getAllCourses),
  // getCreatedCourses: functions.https.onCall(getCreatedCourses),
  onCourseUpdated,
  onCourseDeleted
};
