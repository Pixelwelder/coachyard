const checkAuth = (context) => {
  if (!context.auth) throw new Error('User is not logged in.');
};

const checkPrivilege = (auth, privilege) => {
  const { customClaims = {} } = auth;
  const { privileges = 0 } = customClaims;

  return (privileges & privilege) === privilege;
};

module.exports = { checkAuth, checkPrivilege };
