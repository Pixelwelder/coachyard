const admin = require('firebase-admin');
const { project_id, service_account } = require('../config').firebase;
const { toKebab } = require('../util/string');
// const { newUserMeta, newCourseToken, newCourse, newCourseItem, version } = require('../data');
// const { createSlug } = require('../util/firestore');
// const { tokenFromCourse } = require('../util/course');
// const { uploadImage } = require('../util/images');
// const { _createSchedulingUser, createIcon } = require('../users/utils');

admin.initializeApp({
  credential: admin.credential.cert(service_account),
  databaseURL: `https://${project_id}.firebaseio.com`,
  storageBucket: `${project_id}.appspot.com`,
  projectId: project_id
});

const repairUsers = async () => {
  const userDocs = await admin.firestore().collection('users').get();
  const users = userDocs.docs.map(doc => doc.data());
  const usersBySlugs = users.reduce((accum, user) => {
    if (user.slug) return { ...accum, [user.slug]: user };
    return accum;
  }, {});
  await Promise.all(users.map(async (user) => {
    let authUser;
    try {
      authUser = await admin.auth().getUser(user.uid);
    } catch (error) {
      console.log('No authUser', user);
      return;
    }

    let slug = toKebab(authUser.displayName);
    if (usersBySlugs[slug]) slug = `${slug}-1`;
    usersBySlugs[slug] = user;

    delete user.tier;
    delete user.image;
    user.displayName = authUser.displayName;
    user.slug = slug;
    user.version = 5;
    user.updated = admin.firestore.Timestamp.now();

    await admin.firestore().collection('users').doc(user.uid).set(user);
    console.log('updated', authUser.displayName);
  }));
}; // Martin: chPgtXa3dbTssgWCpKy3rnIB9Wn1 vs hlGVubd0H8R6DaszeapID9T1rhs1

const repairTokens = async () => {
  const tokenDocs = await admin.firestore().collection('tokens').get();
  const userDocs = await admin.firestore().collection('users').get();
  const usersById = userDocs.docs
    .reduce((accum, doc) => ({ ...accum, [doc.id]: doc.data() }), {});
  await Promise.all(tokenDocs.docs.map(async (doc) => {
    const token = doc.data();
    const user = usersById[token.user];
    if (!user) {
      console.log('No user:', token);
      return;
    }
    console.log(`${token.userDisplayName} should be ${user.displayName}`);
    const newToken = {
      ...token,
      uid: doc.id,
      version: 5,
      userDisplayName: user.displayName
    };
    if (token.creatorUid === token.user) newToken.access = 'admin';
    await admin.firestore().collection('tokens').doc(doc.id).set(newToken);
  }));
};

const repairCourses = async () => {
  console.log('repairing courses...')
  const courseDocs = await admin.firestore().collection('courses').get();
  await Promise.all(courseDocs.docs.map(async (courseDoc) => {
    const itemDocs = await courseDoc.ref.collection('items')
      .orderBy('created')
      .get();
    const itemOrder = itemDocs.docs.map(itemDoc => itemDoc.id);
    await courseDoc.ref.update({ itemOrder });
    console.log('itemOrder', itemOrder);
  }));
  console.log('courses repaired');
};

const repair = async () => {
  // await repairUsers();
  // await repairTokens();
  await repairCourses();
};

const go = () => {
  repair();
};

go();
