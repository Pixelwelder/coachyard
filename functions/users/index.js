const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');
const { newStudent, newUserMeta } = require('../data');

/**
 * Creates a user but does not log them in.
 */
const createUser = async (data, context) => {
  try {
    const { email, password, roles, displayName } = data;
    console.log('creating user', data);

    // Create the user in the auth database.
    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      password,
      displayName
    });

    // Add custom user claims.
    const { uid } = userRecord;
    await admin.auth().setCustomUserClaims(uid, { roles });

    // Now we need a user meta for additional information.
    const timestamp = admin.firestore.Timestamp.now();
    let userMeta;

    // If this user was created by a teacher, the user meta will already exist.
    const snapshot = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!snapshot.empty) {
      // It exists
      userMeta = snapshot.docs[0].data();
    } else {
      userMeta = newUserMeta({
        uid,
        created: timestamp
      });
    }

    userMeta.updated = timestamp;

    // Use the same ID for both.
    await admin.firestore().collection('users').doc(uid).set(userMeta);
    return { message: 'Done.', data: { uid } }
  } catch (error) {
    console.log('error', error.message)
    throw new functions.https.HttpsError('internal', error.message, error);
  }
  // const result2 = await admin.auth().setCustomUserClaims()
};

/**
 * Create a meta object every time a user is created.
 */
const onCreateUser = functions.auth.user().onCreate(async (user, context) => {
  const { uid, email } = user;
  const doc = admin.firestore().collection('users').doc(uid);
  const timestamp = admin.firestore.Timestamp.now();
  const userMeta = newUserMeta({
    uid,
    created: timestamp,
    updated: timestamp
  });
  const result = await doc.set(userMeta);

  // Load all items that mention this student and change email to uid.
  const itemsResult = await admin.firestore().runTransaction(async (transaction) => {
    const itemsRef = admin.firestore().collection('courses')
      .where('student', '==', email);

    const itemsDocs = await transaction.get(itemsRef);

    itemsDocs.forEach((doc) => {
      transaction.update(doc.ref, { student: uid });
    });

    console.log(`Updated ${itemsDocs.size} items.`);
  })

  console.log('Update complete.');
});

/**
 * Returns the metadata for the currently logged-in user.
 */
const getUserMeta = async (data, context) => {
  try {
    checkAuth(context);
    const { uid } = context.auth;
    const snapshot = await admin.firestore().collection('users').doc(uid).get();
    const userMeta = snapshot.data();

    // if (!userMeta) throw new Error(`No user meta for user ${uid}.`)
    return userMeta;
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Creates a student for the logged-in teacher.
 */
const createStudent = async (data, context) => {
  try {
    console.log('createStudent', data);
    checkAuth(context);

    // Grab the teacher.
    console.log('getting teacher');
    const { uid } = context.auth;
    const snapshot = await admin.firestore().collection('users').doc(uid).get();
    const teacherMeta = snapshot.data();
    const students = teacherMeta.students || [];

    const email = data.email.toLowerCase();

    console.log('checking current students');
    // Make sure this teacher doesn't already have this student.
    const existingStudent = students.find((student) => {
      console.log('comparing', student.email, email);
      return student.email === email;
    });
    if (existingStudent) {
      throw new Error(`Looks like you already have a student with email ${email}.`);
    }

    console.log('checking for student as existing auth user');
    // If this student exists, grab them.
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord) console.log('FOUND');
    } catch {
      // User doesn't exist.
    }

    // Now create a new student.
    console.log('creating student');
    const { displayName } = data;
    const timestamp = admin.firestore.Timestamp.now();
    const student = newStudent({
      uid: (userRecord && userRecord.uid) || '',
      email,
      displayName,
      created: timestamp,
      updated: timestamp
    });

    students.push(student);
    await admin.firestore().collection('users').doc(uid).update({ students });
    console.log('Done.');
    return { message: 'Student added.', data: student };
  } catch (error) {
    console.log('error', error.message);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  createUser: functions.https.onCall(createUser),
  getUserMeta: functions.https.onCall(getUserMeta),
  createStudent: functions.https.onCall(createStudent),
  onCreateUser
};
