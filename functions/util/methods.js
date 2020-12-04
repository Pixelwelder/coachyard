const getMethod = ({ method = 'get' } = {}) => method.toLowerCase();
const METHODS = {
  GET: 'get',
  POST: 'post',
  DELETE: 'delete'
};

module.exports = { getMethod, METHODS };
