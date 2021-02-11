const getMethod = ({ method = 'get' } = {}) => method.toLowerCase();
const METHODS = {
  GET: 'get',
  POST: 'post',
  DELETE: 'delete',
  PUT: 'put'
};

module.exports = { getMethod, METHODS };
