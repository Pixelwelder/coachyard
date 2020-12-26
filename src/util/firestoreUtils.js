/**
 * Turns a Firebase timestamp into a serializable value.
 * @param timestamp
 * @returns an object
 */
const parseTimestamp = (timestamp) => {
  return Object.entries(timestamp).reduce((accum, [name, value]) => {
    return { ...accum, [name]: value };
  }, {});
};

/**
 * Parses anything that's not serializable.
 * @param obj
 * @returns the same object with serializable members
 */
const parseUnserializables = (obj) => {
  const newObj = { ...obj };
  if (newObj.created) newObj.created = parseTimestamp(newObj.created);
  if (newObj.updated) newObj.updated = parseTimestamp(newObj.updated);

  return newObj;
};

export { parseTimestamp, parseUnserializables };
