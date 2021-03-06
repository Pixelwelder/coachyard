const toKebab = (string = '') => string.toLowerCase()
  .split(' ').join('-')
  .split('_').join('-');

module.exports = {
  toKebab
};
