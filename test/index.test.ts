/**
 * @jest-environment jsdom
 */

import {
  Mount,
  isMount,
  getMountValue,
  selectMounts,
  useMount,
  isUsed,
} from '../src';

function assertMount(x: unknown): asserts x is Mount {
  if (!isMount(x)) {
    throw new Error(`Argument is not a Mount: ${x}`);
  }
}

describe('isMount', () => {
  test('should not detect non-element objects', () => {
    const mount = { dataset: { mount: 'true' }, id: 'x' };
    expect(isMount(mount)).toBe(false);
  });

  test('should detect <div id="x" data-mount/>', () => {
    const mount = document.createElement('div');
    mount.dataset.mount = 'true';
    mount.id = 'x';
    expect(isMount(mount)).toBe(true);
  });

  test('should not detect <a id="x"/>', () => {
    const mount = document.createElement('a');
    mount.id = 'x';
    expect(isMount(mount)).toBe(false);
  });

  test('should not detect <a name="x"/>', () => {
    const mount = document.createElement('a');
    mount.name = 'x';
    expect(isMount(mount)).toBe(false);
  });

  test('should not detect <a id="x" href="link" />', () => {
    const mount = document.createElement('a');
    mount.id = 'x';
    mount.href = 'link';
    expect(isMount(mount)).toBe(false);
  });

  test('should not detect <a name="x" href="link" />', () => {
    const mount = document.createElement('a');
    mount.name = 'x';
    mount.href = 'link';
    expect(isMount(mount)).toBe(false);
  });

  describe('with exact flag', () => {
    test('should detect <div id="exact" data-mount />', () => {
      const mount = document.createElement('div');
      mount.dataset.mount = 'true';
      mount.id = 'exact';
      expect(isMount(mount, 'exact', true)).toBe(true);
    });

    test('should not detect <div id="exactASprefix data-mount />', () => {
      const mount = document.createElement('div');
      mount.dataset.mount = 'true';
      mount.id = 'exactASprefix';
      expect(isMount(mount, 'exact', true)).toBe(false);
    });
  });

  describe('with prefix supplied', () => {
    test('should detect <div id="exact" data-mount />', () => {
      const mount = document.createElement('div');
      mount.dataset.mount = 'true';
      mount.id = 'exact';
      expect(isMount(mount, 'exact')).toBe(true);
    });

    test('should detect <div id="exactASprefix data-mount />', () => {
      const mount = document.createElement('div');
      mount.dataset.mount = 'true';
      mount.id = 'exactASprefix';
      expect(isMount(mount, 'exact')).toBe(true);
    });
  });
});

describe('getMountValue', () => {
  const mount = document.createElement('div');
  mount.id = 'valueOFname';
  mount.dataset.mount = 'true';
  assertMount(mount);

  test('should return the content of the name attribute', () => {
    expect(getMountValue(mount)).toBe('valueOFname');
  });

  test('should return the content of the ID attribute', () => {
    mount.id = 'valueOFid';
    expect(getMountValue(mount)).toBe('valueOFid');
  });

  describe('with prefix supplied', () => {
    const mount = document.createElement('div');
    mount.id = 'valueOFname';
    mount.dataset.mount = 'true';
    assertMount(mount);

    test('should return the post-prefix content of the name attribute', () => {
      expect(getMountValue(mount, 'value')).toBe('OFname');
    });

    test('should return the post-prefix content of the ID attribute', () => {
      mount.id = 'valueOFid';
      expect(getMountValue(mount, 'value')).toBe('OFid');
    });

    test("should not remove prefix that doesn't match", () => {
      mount.id = 'valueOFid';
      expect(getMountValue(mount, 'balue')).toBe('valueOFid');
    });
  });
});

describe('useMount & isUsed', () => {
  test('should mark a mount as used and return it', () => {
    const mount = document.createElement('div');
    mount.id = 'valueOFname';
    mount.dataset.mount = 'true';
    assertMount(mount);
    const usedMount = useMount(mount);
    expect(usedMount).toBe(mount);
    expect(isUsed(usedMount)).toBe(true);
  });

  test('should throw if already used', () => {
    const mount = document.createElement('div');
    mount.id = 'valueOFname';
    mount.dataset.mount = 'true';
    mount.dataset.mountUsed = 'other';
    assertMount(mount);
    expect(() => useMount(mount)).toThrow();
  });
});

describe('selectMounts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
    <div>
      <div id="tests" data-mount></div>
      <div id="test" data-mount></div>
      <div id="test" data-mount-used="OTHER"></div>
      <div id="other" data-mount></div>
    </div>
    `;
  });

  test('should select all unused mounts when no selector is passed', () => {
    expect(selectMounts()).toHaveLength(3);
  });

  test('should return an array', () => {
    expect(selectMounts('test')).toBeInstanceOf(Array);
  });

  test('should exclude used points on subsequent calls', () => {
    expect(selectMounts('test').length).toBe(2);
    expect(selectMounts('test').length).toBe(0);
  });

  test('should return used points if asked to', () => {
    expect(selectMounts('test').length).toBe(2);
    expect(selectMounts('test', { includeOwnUsed: true }).length).toBe(2);
  });

  test('should not mark points as used if asked not to', () => {
    expect(selectMounts('test', { markAsUsed: false }).length).toBe(2);
    expect(selectMounts('test').length).toBe(2);
  });

  test('should match based on prefix by default', () => {
    expect(selectMounts('test').length).toBe(2);
  });

  test('should only match exact selectors if asked to', () => {
    expect(selectMounts('test', { exact: true }).length).toBe(1);
  });

  test('should not return points used by other instances', () => {
    expect(selectMounts('test', { includeOwnUsed: true }).length).toBe(2);
  });
});
