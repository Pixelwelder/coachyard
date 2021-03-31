const functions = require('firebase-functions');
const admin = require('firebase-admin');

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
  onChatMessageCreated
};
