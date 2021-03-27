const { createDuration, createDay } = require('../providers');

// TODO Incomplete.
describe('createDuration', () => {
  test('it should create a duration', () => {
    const duration = createDuration();
    expect(typeof duration.start).toBe('string');
    expect(typeof duration.end).toBe('string');
  });
});

// TODO Incomplete.
describe('createDay', () => {
  test('it should create a day', () => {
    const day = createDay();
    expect(typeof day.start).toBe('string');
    expect(typeof day.end).toBe('string');
    expect(Array.isArray(day.breaks)).toBe(true);
    expect(typeof day.breaks[0].start).toBe('string');
    expect(typeof day.breaks[0].end).toBe('string');
  });
});
