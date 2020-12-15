const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { checkAuth } = require('../util/auth');

const newInvite = (overrides) => ({
  created: '',
  updated: '',
  teacherUid: '',
  teacherDisplayName: '',
  email: '',
  displayName: '',
  ...overrides
});

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

    const invites = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
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

    const invites = await querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
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
    // const snapshot = await admin.firestore().collection('users')
    //   .where('email', '==', email)
    //   .get();
    //
    // if (!snapshot.docs.length) throw new Error(`No user with email ${email}`)
    // if (snapshot.docs.length > 1) throw new Error(`${snapshot.docs.length} users with email ${email}.`);

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

module.exports = {
  getInvitesTo: functions.https.onCall(getInvitesTo),
  getInvitesFrom: functions.https.onCall(getInvitesFrom),
  createInvite: functions.https.onCall(createInvite)
};
