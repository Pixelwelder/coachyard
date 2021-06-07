const admin = require('firebase-admin');
const { project_id, service_account } = require('../config').firebase;
const { newUserMeta, newCourseToken, newCourse, newCourseItem, version } = require('../data');
const { createSlug } = require('../util/firestore');
const { tokenFromCourse } = require('../util/course');
const { uploadImage } = require('../util/images');
const { _createSchedulingUser, createIcon } = require('../users/utils');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const migrateUsers = async () => {
  // Migrates from v0 to v5.
  console.log('migrate users');
  const userDocs = await admin.firestore().collection('users').get();
  await Promise.all(userDocs.docs.map(async (doc) => {
    const oldItem = doc.data();

    // v0: { uid, created, updated, displayName, email }
    // v5: { uid, created, updated, displayName, email, description, slug, claims }

    // Nobody has a slug, but there could still be collisions.
    const slug = await createSlug(oldItem);
    const newItem = newUserMeta({
      ...oldItem, slug, updated: admin.firestore.Timestamp.now()
    });
    await doc.ref.set(newItem);

    // Create icon.
    console.log('create icon');
    await createIcon({ uid: newItem.uid });
    console.log('create icon complete');

    // Create banner image.
    console.log('create banner');
    await uploadImage({
      path: './users/images/coach-banner.jpg',
      destination: `banners/${newItem.uid}`,
      type: 'jpg'
    });
    console.log('create banner complete');
  }));
};

const migrateItems = async () => {
  // We have to move items to a nested subcollection of their courses.
  console.log('migrating items...');
  const itemDocs = await admin.firestore().collection('items').get();
  console.log(itemDocs.size, 'items found');
  const items = itemDocs.docs.map((doc) => {
    const oldItem = doc.data();
    delete oldItem.image;
    return newCourseItem({
      ...oldItem,
      version,
      updated: admin.firestore.Timestamp.now(),
      dateEnd: null,
      // length, parent, started, type - all defaults
    });

    // First, bring the schema up to date.
    // { version, uid, created, updated }
    // { courseUid, creatorUid, date, description, displayName,  image , originalFilename, playbackId, room, status, streamingId, streamingInfo }
    // { version, uid, created, updated }
    // { courseUid, creatorUid, date, description, displayName, -image-, originalFilename, playbackId, room, status, streamingId, streamingInfo }
    // Removed: image
    // Added: dateEnd, length, parent, started, type
  });

  // Now park them in the right places: with the courses they're associated with.
  // These are all basic courses, so we don't need to worry about parent-child relationships.
  const itemsByCourseUid = items.reduce((accum, item) => {
    const items = (accum[item.courseUid] ? accum[item.courseUid] : accum[item.courseUid] = []);
    items.push(item);
    return accum;
  }, {});

  // const dateString = new Date().toJSON();
  const promises = [];
  Object.entries(itemsByCourseUid).forEach(([courseUid, items]) => {
    items.forEach(item => {
      promises.push(admin.firestore()
        .doc(`courses/${courseUid}/items/${item.uid}`).set(item)
      );
    });
  });
  await Promise.all(promises);
};

const migrateCourses = async () => {
  console.log('migrating courses...');
  // Grab all items first.
  // const items = await migrateItems();

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
      // localItemOrder - default since they are all basics
      isPublic: true // old behavior
    });

    return courseDoc.ref.set(newItem);
  }));
  console.log('migrated', courseDocs.size, 'courses');
};

// To migrate tokens, we have to get courses.
const migrateTokens = async () => {
  // v0 to v5
  console.log('migrating tokens');
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
  console.log(`migrated ${docs.size} tokens`)

  // user, userDisplayName, courseUid, price, priceFrequency, access, displayName, parent, creatorUid, type, isPublic
};

const migrateStripeCustomers = async () => {
  console.log('migrating stripe customers');
  const docs = await admin.firestore().collection('stripe_customers').get();
  Promise.all(docs.docs.map((doc) => {
    const oldItem = doc.data();
    return doc.ref.set({
      ...oldItem,
      updated: admin.firestore.Timestamp.now(),
      version
    })
  }));
  console.log(`migrated ${docs.size} stripe customers`);
};

const migrate = async () => {
  console.log('--- MIGRATING ---');
  // Gotta do these one at a time.
  await migrateUsers();
  await migrateCourses();
  await migrateItems();
  await migrateTokens();
  await migrateStripeCustomers();
};


const go = async () => {
  // await backUp(); // We have a good backup now.
  await migrate();
};

go();
