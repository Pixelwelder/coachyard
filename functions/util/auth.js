const functions = require('firebase-functions');

const checkAuth = (context) => {
  return !!context.auth;
};

const checkPrivilege = (auth, privilege) => {
  const { customClaims = {} } = auth;
  const { privileges = 0 } = customClaims;

  return (privileges & privilege) === privilege;
};

module.exports = { checkAuth, checkPrivilege };
