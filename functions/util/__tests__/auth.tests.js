const { checkPrivilege } = require('../auth');

describe('checkPrivilege', () => {
  test('it should correctly check a privilege', () => {
    expect(checkPrivilege({ customClaims: { privileges: 1 } }, 1)).toBe(true);
    expect(checkPrivilege({ customClaims: { privileges: 8 | 1 } }, 8)).toBe(true);
    expect(checkPrivilege({ customClaims: { privileges: 1 | 2 | 4 | 8 } }, 2 | 4 | 8)).toBe(true);
    expect(checkPrivilege({ customClaims: { privileges: 8 | 1 } }, 2)).toBe(false);
    expect(checkPrivilege({ customClaims: undefined }, 8)).toBe(false);
  });
});
