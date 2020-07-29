// Testing code branches that would only be invoked in non-typescript usage

const { getMountValue, getTrailingMountValue } = require('../src/index.ts');

describe('getMountValue', () => {
  const mount = document.createElement('a');

  test('should return an empty string', () => {
    expect(getMountValue(mount)).toBe('');
  });
});

describe('getTrailingMountValue', () => {
  const mount = document.createElement('a');

  test('should return an empty string', () => {
    expect(getTrailingMountValue(mount, 'value')).toBe('');
  });
});
