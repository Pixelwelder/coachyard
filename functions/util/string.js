const toKebab = (string = '') => string.toLowerCase()
  .replace(/[^\w\s]/gi, '')
  .split(' ').join('-')
  .split('_').join('-');

module.exports = {
  toKebab
};
