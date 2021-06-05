const admin = require('firebase-admin');
const { project_id, service_account } = require('../config').firebase;
const { newUserMeta, newCourseToken, newCourse } = require('../data');
const { createSlug } = require('../util/firestore');
const { tokenFromCourse } = require('../util/course');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const backUpCollection = async ({
  collectionName,
  targetDocName
}) => {
  console.log(`backing up ${collectionName} to ${targetDocName}`)
  const docs = await admin.firestore().collection(collectionName).get();
  console.log(`found ${docs.size} docs in ${collectionName}`)
  const targetCollection = admin.firestore().doc(targetDocName).collection(collectionName);
  const promises = docs.docs.map(async (doc) => {
    console.log(`doc ${doc.id}...`)
    const targetDoc = targetCollection.doc(doc.id);
    await targetDoc.set(doc.data());
    // Now children.
    const subNames = (await doc.ref.listCollections()).map(({ id }) => id);
    if (subNames.length) {
      // Only one level instead of TODO recursive
      await Promise.all(
        subNames.map(async (subCollectionName) => {
          const subDocs = await doc.ref.collection(subCollectionName).get();
          console.log(`found ${subDocs.size} subdocs in ${subCollectionName}`);
          await Promise.all(
            subDocs.docs.map((subDoc) => targetDoc
              .collection(subCollectionName).doc(subDoc.id).set(subDoc.data()))
          );
        })
      );
    }
  });
  await Promise.all(promises);

  console.log(`${collectionName} is backed up`);
};

// First, we back up everything.
const backUp = async () => {
  const dateString = new Date().toJSON();//.split('T')[0];
  console.log(`--- BACKING UP ${dateString} ---`);

  await Promise.all(
    ['courses', 'easy_customers', 'easy_providers', 'stripe_customers', 'stripe_events', 'tokens', 'users']
      .map(collectionName => backUpCollection({
        collectionName,
        targetDocName: `_backups/${dateString}`
      }))
  );

  console.log('backed up');
};

const migrateUsers = async () => {
  // Migrates from v0 to v5.
  console.log('migrate users');
  const docs = await admin.firestore().collection('users').get();
  await Promise.all(docs.docs.map(async (doc) => {
    const oldItem = doc.data();

    // v0: { uid, created, updated, displayName, email }
    // v5: { uid, created, updated, displayName, email, description, slug, claims }

    // Nobody has a slug, but there could still be collisions.
    const slug = await createSlug(oldItem);
    const newItem = newUserMeta({
      ...oldItem, slug, updated: admin.firestore.Timestamp.now()
    });
    await doc.ref.set(newItem);
  }));
};

const migrateCourses = async () => {
  console.log('migrating courses...');
  const courseDocs = await admin.firestore().collection('courses').get();
  await Promise.all(courseDocs.docs.map((courseDoc) => {
    const oldItem = courseDoc.data();
    const newItem = newCourse({
      // version
      uid: oldItem.uid,
      created: oldItem.created,
      updated: admin.firestore.Timestamp.now(),

      // image - removed

      creatorUid: oldItem.creatorUid,
      displayName: oldItem.displayName,
      description: oldItem.description,
      // type - default
      // price - default
      // priceFrequency - default
      // parent - default
      // numChats - default
      // numChatsUnseen - default
      // itemOrder - default
      // localItemOrder - default
      isPublic: true // old behavior
    });

    return courseDoc.ref.set(newItem);
  }));
};

// To migrate tokens, we have to get courses.
const migrateTokens = async () => {
  // v0 to v5
  const docs = await admin.firestore().collection('tokens').get();

  // v0: { version, uid, created, updated } { access, courseUid, description, displayName, image, user }
  // Same: version, uid, created
  // Remove: image, version (to use current)
  // Update: updated
  // Add: userDisplayName, price, priceFrequency, parent, creatorUid, type, isPublic

  await Promise.all(docs.docs.map(async (doc) => {
    const oldItem = doc.data();
    // Get course. Assumes course has been updated.
    const course = (await admin.firestore().collection('courses').doc(oldItem.courseUid).get()).data();

    // Get user meta.
    let user = {};
    const userMetaDoc = await admin.firestore().collection('users').doc(oldItem.user).get();
    if (userMetaDoc.exists) user = userMetaDoc.data();

    const newItem = {
      ...tokenFromCourse(course),
      created: oldItem.created,
      user: oldItem.user,
      userDisplayName: user.displayName || oldItem.user
    };

    await doc.ref.set(newItem);
  }));

  // user, userDisplayName, courseUid, price, priceFrequency, access, displayName, parent, creatorUid, type, isPublic
};

const migrate = async () => {
  console.log('--- MIGRATING ---');
  // Gotta do these one at a time.
  // await migrateUsers(); // TODO Gotta create the other users from this (for Easy)
  // await migrateCourses();
  await migrateTokens();
};

const go = async () => {
  // await backUp(); // We have a good backup now.
  await migrate();
};

go();
