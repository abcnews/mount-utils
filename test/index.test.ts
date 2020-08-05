import {
  Mount,
  isMount,
  isExactMount,
  isPrefixedMount,
  exactMountSelector,
  prefixedMountSelector,
  getMountValue,
  getTrailingMountValue,
  ensureBlockMount,
  selectMount,
  useMount,
  isUsed,
} from '../src';

function assertMount(x: unknown): asserts x is Mount {
  if (!isMount(x)) {
    throw new Error(`Argument is not a Mount: ${x}`);
  }
}

describe('exactMountSelector', () => {
  test('should return the correct selector string', () => {
    expect(exactMountSelector('exact')).toBe(
      '[data-mount][id="exact"],a[id="exact"]:not([href]),a[name="exact"]:not([href])'
    );
  });
});

describe('prefixedMountSelector', () => {
  test('should return the correct selector string', () => {
    expect(prefixedMountSelector('exact')).toBe(
      '[data-mount][id^="exact"],a[id^="exact"]:not([href]),a[name^="exact"]:not([href])'
    );
  });
});

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

  test('should detect <a id="x"/>', () => {
    const mount = document.createElement('a');
    mount.id = 'x';
    expect(isMount(mount)).toBe(true);
  });

  test('should detect <a name="x"/>', () => {
    const mount = document.createElement('a');
    mount.name = 'x';
    expect(isMount(mount)).toBe(true);
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
});

describe('isExactMount', () => {
  test('should detect <div id="exact" data-mount />', () => {
    const mount = document.createElement('div');
    mount.dataset.mount = 'true';
    mount.id = 'exact';
    expect(isExactMount(mount, 'exact')).toBe(true);
  });

  test('should not detect <div id="exactASprefix data-mount />', () => {
    const mount = document.createElement('div');
    mount.dataset.mount = 'true';
    mount.id = 'exactASprefix';
    expect(isExactMount(mount, 'exact')).toBe(false);
  });
});

describe('isPrefixedMount', () => {
  test('should detect <div id="exact" data-mount />', () => {
    const mount = document.createElement('div');
    mount.dataset.mount = 'true';
    mount.id = 'exact';
    expect(isPrefixedMount(mount, 'exact')).toBe(true);
  });

  test('should detect <div id="exactASprefix data-mount />', () => {
    const mount = document.createElement('div');
    mount.dataset.mount = 'true';
    mount.id = 'exactASprefix';
    expect(isPrefixedMount(mount, 'exact')).toBe(true);
  });
});

describe('getMountValue', () => {
  const mount = document.createElement('a');
  mount.name = 'valueOFname';

  assertMount(mount);

  test('should return the content of the name attribute', () => {
    expect(getMountValue(mount)).toBe('valueOFname');
  });

  test('should return the content of the ID attribute', () => {
    mount.id = 'valueOFid';
    expect(getMountValue(mount)).toBe('valueOFid');
  });
});

describe('getTrailingMountValue', () => {
  const mount = document.createElement('a');
  mount.name = 'valueOFname';

  assertMount(mount);

  test('should return the post-prefix content of the name attribute', () => {
    expect(getTrailingMountValue(mount, 'value')).toBe('OFname');
  });

  test('should return the post-prefix content of the ID attribute', () => {
    mount.id = 'valueOFid';
    expect(getTrailingMountValue(mount, 'value')).toBe('OFid');
  });
});

describe('ensureBlockMount', () => {
  test('should create a block mount', () => {
    document.body.innerHTML = `
    <div>
      <a name="test"></a>
    </div>
    `;
    const mount = document.querySelector(exactMountSelector('test'));
    assertMount(mount);
    const block = ensureBlockMount(mount);
    expect(block.tagName).toBe('DIV');
  });

  test('should not change a block mount', () => {
    document.body.innerHTML = `
    <div>
      <div id="test" data-mount></div>
    </div>
    `;
    const mount = document.querySelector(exactMountSelector('test'));
    assertMount(mount);
    const block = ensureBlockMount(mount);
    expect(block).toBe(mount);
  });

  test('should throw if the mount has no parent', () => {
    const mount = document.createElement('a');
    mount.name = 'test';
    assertMount(mount);
    expect(() => ensureBlockMount(mount)).toThrow();
  });

  test('should set relevant attributes on created block elements', () => {
    document.body.innerHTML = `
    <div>
      <a name="test"></a>
      <a id="test"></a>
    </div>
    `;
    const mounts = Array.from(
      document.querySelectorAll(exactMountSelector('test'))
    )
      .filter(isMount)
      .map(ensureBlockMount);

    expect(mounts[0].id).toBe('test');
    expect(mounts[1].id).toBe('test');
    expect(mounts[0].dataset.mount).toBeDefined();
    expect(mounts[1].dataset.mount).toBeDefined();
  });
});

describe('useMount & isUsed', () => {
  test('should mark a mount as used and return it', () => {
    const mount = document.createElement('a');
    mount.name = 'valueOFname';
    assertMount(mount);
    const usedMount = useMount(mount);
    expect(usedMount).toBe(mount);
    expect(isUsed(usedMount)).toBe(true);
  });

  test('should throw if already used', () => {
    const mount = document.createElement('a');
    mount.name = 'valueOFname';
    mount.dataset.mountUsed = 'other';
    assertMount(mount);
    expect(() => useMount(mount)).toThrow();
  });
});

describe('selectMount', () => {
  beforeEach(() => {
    document.body.innerHTML = `
    <div>
      <a name="tests"></a>
      <div id="test" data-mount></div>
      <a name="test" data-mount-used="OTHER"></a>
    </div>
    `;
  });

  test('should return an array', () => {
    expect(selectMount('test')).toBeInstanceOf(Array);
  });

  test('should exclude used points on subsequent calls', () => {
    expect(selectMount('test').length).toBe(2);
    expect(selectMount('test').length).toBe(0);
  });

  test('should return used points if asked to', () => {
    expect(selectMount('test').length).toBe(2);
    expect(selectMount('test', { includeOwnUsed: true }).length).toBe(2);
  });

  test('should not mark points as used if asked not to', () => {
    expect(selectMount('test', { markAsUsed: false }).length).toBe(2);
    expect(selectMount('test').length).toBe(2);
  });

  test('should not covert to block mounts by default', () => {
    expect(selectMount('test')[0].tagName).toBe('A');
  });

  test('should covert to block mounts when asked to', () => {
    expect(selectMount('test', { convertToBlock: true })[0].tagName).toBe(
      'DIV'
    );
  });

  test('should keep the used indicator during mount point coversions', () => {
    selectMount('test', { convertToBlock: true });
    expect(
      selectMount('test', { includeOwnUsed: true })[0].dataset.mountUsed
    ).toBeDefined();
  });

  test('should match based on prefix by default', () => {
    expect(selectMount('test').length).toBe(2);
  });

  test('should only match exact selectors if asked to', () => {
    expect(selectMount('test', { exact: true }).length).toBe(1);
  });

  test('should not return points used by other instances', () => {
    expect(selectMount('test', { includeOwnUsed: true }).length).toBe(2);
  });
});
