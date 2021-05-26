const admin = require('firebase-admin');

const deleteSessions = async ({ studentUid, courseUid }) => {
  await admin.firestore().runTransaction(async (transaction) => {
    const docs = await admin.firestore()
      .collection('stripe_customers').doc(studentUid)
      .collection('sessions').doc(courseUid)
      .collection('sessions')
      .get();

    if (docs.size) {
      console.log('Deleting all sessions');
      await Promise.all(docs.docs.map((doc) => {
        return transaction.delete(doc.ref);
      }));
    }
  });
};

module.exports = { deleteSessions };
