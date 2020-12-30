const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { getDailyHeaders } = require('../util/headers');
const { METHODS } = require('../util/methods');

const { checkAuth } = require('../util/auth');
const { newInvite } = require('../data');

const createInvite = async (data, context) => {
  console.log('createInvite', data);
  try {
    console.log('createInvite', context.token);
    checkAuth(context);
    const { uid } = context.auth;
    const { name: creatorDisplayName = '', email: teacherEmail } = context.auth.token;
    const { email, displayName, date } = data;

    // Make sure it's not you.
    if (email === teacherEmail) throw new Error('Though we encourage lifelong learning, you cannot invite yourself.');

    // Run some checks.
    const teacherDoc = await admin.firestore().collection('users').doc(uid).get();
    const teacherMeta = teacherDoc.data();

    // TODO Make sure it doesn't overlap another one.

    // Create the invite.
    const doc = admin.firestore().collection('invites').doc();
    const timestamp = admin.firestore.Timestamp.now();
    const invite = newInvite({
      uid: doc.id,
      created: timestamp,
      updated: timestamp,
      creatorUid: uid,
      creatorDisplayName,
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
  console.log('_launchRoom', name);
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
  try {
    checkAuth(context);
    const { uid } = data;

    console.log('launching room...');
    const itemDoc = await admin.firestore().collection('items').doc(uid).get();
    if (!itemDoc.exists) throw new Error(`No item by uid ${uid}.`);

    // Does the room already exist?
    const currentRoom = await _checkRoom({ name: uid });
    if (!currentRoom.error) {
      // It exists. Is it still available?
      if (currentRoom.completed) throw new Error('This session is now over.');
      return currentRoom;
    }

    console.log('creating room...');
    const newRoom = await _launchRoom({ name: uid });
    if (newRoom.error) throw new Error(newRoom.error);
    console.log('room created', newRoom);

    // Update our record.
    console.log('updating', uid);
    await admin.firestore().collection('items').doc(uid)
      .update({ isInProgress: true, room: newRoom });

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
    const itemDoc = await admin.firestore().collection('items').doc(uid).get();
    if (!itemDoc) throw new Error(`No item by id ${uid}.`);

    const item = itemDoc.data();
    const { creatorUid } = item;
    if (context.auth.uid !== creatorUid) throw new Error('You can only end a session you began.');

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
    await itemDoc.ref.update({ isInProgress: false, isCompleted: true });

    return { message: 'Done.', result: json, sentData: data }
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

module.exports = {
  // getInvitesTo: functions.https.onCall(getInvitesTo),
  // getInvitesFrom: functions.https.onCall(getInvitesFrom),
  createInvite: functions.https.onCall(createInvite),
  updateInvite: functions.https.onCall(updateInvite),
  deleteInvite: functions.https.onCall(deleteInvite),
  launch: functions.https.onCall(launch),
  end: functions.https.onCall(end)
};
