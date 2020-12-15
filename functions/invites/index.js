const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');
const { newStudent, newInvite } = require('../data');

/**
 * Returns all invites addressed to the logged-in user.
 * (Note: invites are addressed by email.)
 */
const getInvitesTo = async (data, context) => {
  try {
    checkAuth(context);

    const { email } = context.auth.token;
    const querySnapshot = await admin.firestore()
      .collection('invites')
      .where('email', '==', email)
      .get();

    const invites = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    console.log(invites);
    return invites;

  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const getInvitesFrom = async (data, context) => {
  try {
    checkAuth(context);
    const { uid } = context.auth;
    const querySnapshot = await admin.firestore()
      .collection('invites')
      .where('teacherUid', '==', uid)
      .get();

    const invites = await querySnapshot.docs.map((doc) => ({ ...doc.data(), uid: doc.id }));
    console.log(invites);
    return invites;
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
}

const createInvite = async (data, context) => {
  console.log('createInvite', data);
  try {
    console.log('createInvite', context.token);
    checkAuth(context);
    const { uid } = context.auth;
    const { name: teacherDisplayName = '' } = context.auth.token;
    const { email, displayName } = data;

    // Make sure this is not already a student.
    const teacherDoc = await admin.firestore().collection('users').doc(uid).get();
    const { students } = teacherDoc.data();
    const exists = students.find(student => student.email === email);
    if (exists) throw new Error(`Teacher ${uid} already has a student with email ${email}.`);

    // Check to make sure we don't already have an invite for this user.
    const querySnapshot = await admin.firestore().collection('invites')
      .where('teacherUid', '==', uid)
      .where('email', '==', email)
      .get();

    if (!querySnapshot.empty) throw new Error(`You already have a pending invite for ${email}.`);

    // TODO Make sure it's not to yourself for some reason.

    const timestamp = admin.firestore.Timestamp.now();
    const invite = newInvite({
      created: timestamp,
      updated: timestamp,
      teacherUid: uid,
      teacherDisplayName,
      email,
      displayName,
    });

    await admin.firestore().collection('invites').doc().set(invite);
    console.log('Done.');
    return { message: 'Invite created', data: invite };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const acceptInvite = async (data, context) => {
  try {
    checkAuth(context);

    const { uid } = data;
    const inviteSnapshot = await admin.firestore().collection('invites').doc(uid).get();
    if (!inviteSnapshot.exists) throw new Error(`No invite by ui ${uid}.`)

    const { teacherUid, email } = inviteSnapshot.data();
    console.log('got invite', teacherUid, email);

    const studentUser = await admin.auth().getUserByEmail(email);
    const { uid: studentUid, displayName } = studentUser;
    console.log('found user', studentUid, displayName);

    const timestamp = admin.firestore.Timestamp.now();
    const student = newStudent({
      uid: studentUid,
      email,
      displayName, // TODO This must be updated when user updates it.
      created: timestamp,
      updated: timestamp
    });

    const teacherSnapshot = await admin.firestore().collection('users').doc(teacherUid).get();
    if (!teacherSnapshot.exists) throw new Error(`No teacher by uid ${teacherUid}.`)

    const teacherMeta = teacherSnapshot.data();
    console.log('got teacher', teacherMeta);

    const existing = teacherMeta.students.find((student) => student.email === email);
    if (existing) throw new Error(`${studentUid} is already a student of teacher ${teacherUid}`);
    const students = [ ...(teacherMeta.students || []), student ];

    await admin.firestore().collection('users').doc(teacherUid).update({ students });
    await admin.firestore().collection('invites').doc(uid).delete();
    return { message: 'Done.' };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const deleteInvite = (data, context) => {
  try {
    checkAuth(context);
    const { uid } = data;
    admin.firestore().collection('invites').doc(uid).delete();
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  getInvitesTo: functions.https.onCall(getInvitesTo),
  getInvitesFrom: functions.https.onCall(getInvitesFrom),
  createInvite: functions.https.onCall(createInvite),
  acceptInvite: functions.https.onCall(acceptInvite),
  deleteInvite: functions.https.onCall(deleteInvite)
};
