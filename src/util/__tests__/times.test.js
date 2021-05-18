const { padNum, to12Hour, listTimes } = require('../times');

describe('padNum', () => {
  test('it should leave some numbers alone', () => {
    expect(padNum('01')).toBe('01');
  });

  test('it should pad some numbers', () => {
    expect(padNum('1')).toBe('01');
  });

  test('it should pad actual numbers', () => {
    expect(padNum(1)).toBe('01');
  });

  test('it should pad a zero', () => {
    expect(padNum(0)).toBe('00');
  });
});

describe('toDisplay', () => {
  test('it should convert a time correctly', () => {
    expect(to12Hour('10:30')).toBe('10:30 AM');
    expect(to12Hour('13:30')).toBe('1:30 PM');
    expect(to12Hour('00:00')).toBe('0:00 AM');
    expect(to12Hour('23:59')).toBe('11:59 PM');
  });
});

describe('listTimes', () => {
  test('it should generate a list of times', () => {
    console.log(listTimes());
  });
});
