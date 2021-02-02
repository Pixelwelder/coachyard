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
 * Parses anything that's not serializable. Yes, it's kinda gross.
 *
 * @param obj
 * @returns the same object with serializable members
 */
const parseUnserializables = (obj) => {
  const newObj = { ...obj };
  if (newObj.created) newObj.created = parseTimestamp(newObj.created);
  if (newObj.updated) newObj.updated = parseTimestamp(newObj.updated);
  if (newObj.started) newObj.started = parseTimestamp(newObj.started);

  return newObj;
};

export { parseTimestamp, parseUnserializables };
