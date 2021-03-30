const { toKebab } = require('../string');

describe('toKebab', () => {
  test('it should turn any string into a kebab-style string', () => {
    expect(toKebab('a string')).toBe('a-string');
    expect(toKebab('An Uppercase String')).toBe('an-uppercase-string');
    expect(toKebab()).toBe('');
    expect(toKebab('oneWord')).toBe('oneword');
    expect(toKebab('snake_case')).toBe('snake-case');
    expect(toKebab('Teacher #1')).toBe('teacher-1');
  });
});
