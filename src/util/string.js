const toKebab = (string = '') => string.toLowerCase().split(' ').join('-');

module.exports = {
  toKebab
};
