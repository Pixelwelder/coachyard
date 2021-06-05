const admin = require('firebase-admin');
const { toKebab } = require('./string');

const createSlug = async ({ displayName }) => {
  let slug = toKebab(displayName);
  const existingRef = admin.firestore().collection('users').where('slug', '==', slug);
  const existingDocs = await existingRef.get();
  // TODO This will give us zack-1-1-1, etc.
  if (existingDocs.size) slug = `${slug}-${existingDocs.size}`;

  return slug;
};

module.exports = { createSlug };
