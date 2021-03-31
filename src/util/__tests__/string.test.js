const { capitalize } = require('../string');

describe('capitalize', () => {
  test('it should capitalize a string', () => {
    expect(capitalize('hello there')).toBe('Hello there');
    expect(capitalize('')).toBe('');
  });
});
