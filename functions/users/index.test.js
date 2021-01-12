const { _convert } = require('./index');
const { newUserMeta } = require('../data/index');

describe('_convert', () => {
  test('it should convert an object with more properties', () => {
    const item = newUserMeta();
    item.extra = 'hello';

    const result = _convert({ item, factoryFunc: newUserMeta });
    expect(result.extra).toBeUndefined();
  });

  test('it should convert an object with fewer properties', () => {
    const item = { extra: 'hello' };
    const result = _convert({ item, factoryFunc: newUserMeta });
    console.log(result);
    expect(result.extra).toBeUndefined();
    expect(result.uid).toBeDefined();
  });
});
