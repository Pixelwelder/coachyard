const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { getDailyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');

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
    const { name: teacherDisplayName = '', email: teacherEmail } = context.auth.token;
    const { email, displayName, date } = data;

    // Make sure it's not you.
    if (email === teacherEmail) throw new Error('Though we encourage lifelong learning, you cannot invite yourself.');

    // Run some checks.
    const teacherDoc = await admin.firestore().collection('users').doc(uid).get();
    const teacherMeta = teacherDoc.data();

    // TODO Make sure it doesn't overlap another one.

    // Make sure this is not already a student.
    // const { students } = teacherMeta;
    // const exists = students.find(student => student.email === email);
    // if (exists) throw new Error(`Teacher ${uid} already has a student with email ${email}.`);

    // Check to make sure we don't already have an invite for this user.
    // const querySnapshot = await admin.firestore().collection('invites')
    //   .where('teacherUid', '==', uid)
    //   .where('email', '==', email)
    //   .get();

    // if (!querySnapshot.empty) throw new Error(`You already have a pending invite for ${email}.`);

    const doc = admin.firestore().collection('invites').doc();
    const timestamp = admin.firestore.Timestamp.now();
    const invite = newInvite({
      uid: doc.id,
      created: timestamp,
      updated: timestamp,
      teacherUid: uid,
      teacherDisplayName,
      email,
      displayName,
      date
    });

    await doc.set(invite);
    console.log('Done.');
    return { message: 'Invite created', data: invite };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const updateInvite = async (data, context) => {
  try {
    checkAuth(context);

    const { uid, update } = data;
    const inviteSnapshot = await admin.firestore().collection('invites').doc(uid).get();
    if (!inviteSnapshot.exists) throw new Error(`No invite by ui ${uid}.`)

    await admin.firestore().collection('invites').doc(uid).update(update);

    // const { teacherUid, email } = inviteSnapshot.data();
    // console.log('got invite', teacherUid, email);

    // const studentUser = await admin.auth().getUserByEmail(email);
    // const { uid: studentUid, displayName } = studentUser;
    // console.log('found user', studentUid, displayName);

    // const timestamp = admin.firestore.Timestamp.now();
    // const student = newStudent({
    //   uid: studentUid,
    //   email,
    //   displayName, // TODO This must be updated when user updates it.
    //   created: timestamp,
    //   updated: timestamp
    // });

    // const teacherSnapshot = await admin.firestore().collection('users').doc(teacherUid).get();
    // if (!teacherSnapshot.exists) throw new Error(`No teacher by uid ${teacherUid}.`)

    // const teacherMeta = teacherSnapshot.data();
    // console.log('got teacher', teacherMeta);

    // const existing = teacherMeta.students.find((student) => student.email === email);
    // if (existing) throw new Error(`${studentUid} is already a student of teacher ${teacherUid}`);
    // const students = [ ...(teacherMeta.students || []), student ];

    // await admin.firestore().collection('users').doc(teacherUid).update({ students });
    // await admin.firestore().collection('invites').doc(uid).delete();
    return { message: 'Done.' };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const _checkRoom = async ({ name }) => {
  const result = await fetch(
    `https://api.daily.co/v1/rooms/${name}`,
    {
      method: METHODS.GET,
      headers: getDailyHeaders()
    }
  );

  const json = await result.json();
  return json;
};

const _launchRoom = async ({ name }) => {
  const result = await fetch(
    `https://api.daily.co/v1/rooms`,
    {
      method: METHODS.POST,
      headers: getDailyHeaders(),
      body: JSON.stringify({
        name,
        properties: {
          enable_recording: 'local'//'rtp-tracks'
        }
      })
    }
  );

  const json = await result.json();
  return json;
};

const deleteInvite = async (data, context) => {
  try {
    checkAuth(context);
    const { uid } = data;

    const currentRoom = await _checkRoom({ name: uid });
    if (!currentRoom.error) throw new Error('Cannot delete an in-progress invite.');

    await admin.firestore().collection('invites').doc(uid).delete();
    return { message: 'Done.' };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const launch = async (data, context) => {
  // Get invite uid.
  try {
    checkAuth(context);
    const { uid } = data;

    const inviteDoc = await admin.firestore().collection('invites').doc(uid).get();
    if (!inviteDoc) throw new Error(`No invite by uid ${uid}`);

    // Does the room already exist?
    const currentRoom = await _checkRoom({ name: uid });
    if (!currentRoom.error) {
      // It exists. Is it still available?
      if (currentRoom.completed) throw new Error('This session is now over.');
      return currentRoom;
    }

    const newRoom = await _launchRoom({ name: uid });
    console.log(newRoom);
    if (newRoom.error) throw new Error(newRoom.error);

    await admin.firestore().collection('invites').doc(uid).update({ inProgress: true, room: newRoom });
    return newRoom;

  } catch (error) {
    console.log(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

/**
 * Ends a meeting.
 */
const end = async (data, context) => {
  try {
    const { uid } = data;
    const inviteDoc = await admin.firestore().collection('invites').doc(uid).get();
    if (!inviteDoc.exists) throw new Error(`No invite by id ${uid}`);

    const invite = inviteDoc.data();
    const { teacherUid } = invite;
    console.log(context.auth.uid, invite);
    if (context.auth.uid !== teacherUid) throw new Error('You can only end a session you began.');

    const result = await fetch(
      `https://api.daily.co/v1/rooms/${uid}`,
      {
        method: METHODS.DELETE,
        headers: getDailyHeaders()
      }
    );

    const json = await result.json();

    console.log(json);

    // TODO Now update the invite.
    await admin.firestore().collection('invites').doc(uid)
      .update({ inProgress: false, room: false, completed: true });

    return { message: 'Done.', result: json, sentData: data }
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  getInvitesTo: functions.https.onCall(getInvitesTo),
  getInvitesFrom: functions.https.onCall(getInvitesFrom),
  createInvite: functions.https.onCall(createInvite),
  updateInvite: functions.https.onCall(updateInvite),
  deleteInvite: functions.https.onCall(deleteInvite),
  launch: functions.https.onCall(launch),
  end: functions.https.onCall(end)
};
