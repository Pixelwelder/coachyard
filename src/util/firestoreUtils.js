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
  return {
    ...obj,
    created: parseTimestamp(obj.created),
    updated: parseTimestamp(obj.updated)
  };
};

export { parseTimestamp, parseUnserializables };
