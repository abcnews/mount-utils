/**
 * @jest-environment jsdom
 */

// Testing code branches that would only be invoked in non-typescript usage

const { getMountValue, ensureBlockMount } = require('../src/index.ts');

describe('ensureBlockMount', () => {
  document.body.innerHTML = `
    <div>
      <a></a>
    </div>
    `;
  const mount = document.querySelector('a');
  test('should not be able to convert non-mount elements', () => {
    expect(() => ensureBlockMount(mount)).toThrow();
  });
});

describe('getMountValue', () => {
  const mount = document.createElement('a');

  test('should return an empty string', () => {
    expect(getMountValue(mount)).toBe('');
  });

  describe('with prefix supplied', () => {
    const mount = document.createElement('a');

    test('should return an empty string', () => {
      expect(getMountValue(mount, 'value')).toBe('');
    });
  });
});
