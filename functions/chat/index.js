const functions = require('firebase-functions');
const admin = require('firebase-admin');

const onChatMessageCreated = functions.firestore.document('courses/{courseUid}/chat/{messageId}')
  .onCreate(async (snapshot, context) => {
    const courseRef = snapshot.ref.parent.parent;
    const courseDoc = await courseRef.get();
    const { numChats } = courseDoc.data();
    await courseRef.update({ numChats: numChats + 1 })
  });

module.exports = {
  onChatMessageCreated
};
