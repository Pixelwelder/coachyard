const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { log } = require('../logging');
const { checkAuth } = require('../util/auth');
const deleteCollection = require('../util/deleteCollection');

const clearChat = async (data, context) => {
  try {
    checkAuth(context);
    const { auth: { uid } } = context;
    const { courseUid } = data;

    const courseRef = admin.firestore().collection('courses').doc(courseUid);
    const courseDoc = await courseRef.get();
    const course = courseDoc.data();
    if (course.creatorUid !== uid) throw new Error(`User ${uid} cannot delete chat from course ${courseUid}.`);

    const collectionPath = `courses/${courseUid}/chat`;
    await deleteCollection(admin.firestore(), collectionPath, 50);

    await courseRef.update({
      numChats: 0,
      numUnseenChats: 0
    });

  } catch (error) {
    log({ message: error.message, data: error, context, level: 'error' });
    throw new functions.https.HttpsError('internal', error.message, error);
  }
};

const onChatMessageCreated = functions.firestore
  .document('courses/{courseUid}/chat/{messageId}')
  .onCreate(async (snapshot, context) => {
    await admin.firestore().runTransaction(async (transaction) => {
      const courseRef = snapshot.ref.parent.parent;
      const courseDoc = await transaction.get(courseRef);
      const { numChats = 0, numUnseenChats = 0 } = courseDoc.data();
      const update = { numChats: numChats + 1, numUnseenChats: numUnseenChats + 1 };
      await transaction.update(courseRef, update);
      console.log('update complete');

      // const tokenRef = admin.firestore().collection('tokens')
      //   .where('courseUid', '==', courseUid)
      //   .where('user', '==', uid);
      // tokenRef.update(update);
    })

  });

module.exports = {
  clearChat: functions.https.onCall(clearChat),
  onChatMessageCreated
};
