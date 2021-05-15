/**
 * Filters user input for item creation.
 */
const filterItem = (inputObj, fields = ['displayName', 'description', 'date', 'status', 'type']) => {
  return fields.reduce((accum, field) => {
    const val = inputObj[field];
    if (typeof val === 'undefined') return accum;
    return { ...accum, [field]: val };
  }, {});
};

module.exports = {
  filterItem
};
