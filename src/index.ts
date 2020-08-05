import './polyfills';

type MountValue = string;
type MountValuePrefix = string;
type MountSelector = string;
type MountSelectorTemplate = string[];
type BlockMount = Element & {
  tagName: 'DIV';
  id: MountValue;
  dataset: {
    mount: string;
    mountUsed: string | undefined;
  };
};
type DeprecatedInlineMount = Element & {
  tagName: 'A';
  id: MountValue;
  dataset: {
    mountUsed: string | undefined;
  };
};
type InlineMount = Element & {
  tagName: 'A';
  name: MountValue;
  dataset: {
    mountUsed: string | undefined;
  };
};

export type Mount = BlockMount | DeprecatedInlineMount | InlineMount;

type Options = {
  exact?: boolean;
  includeOwnUsed?: boolean;
  markAsUsed?: boolean;
  convertToBlock?: boolean;
};

interface MountSelectorCache {
  [key: string]: MountSelector;
}

// https://gist.github.com/LeverOne/1308368
// Small local implementation to avoid a dependency
const INSTANCE_ID: string = ((a?: any, b?: any): string => {
  for (
    b = a = '';
    a++ < 36;
    b +=
      (a * 51) & 52
        ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16)
        : '-'
  );
  return b;
})();

const MOUNT_SELECTOR_TEMPLATE: MountSelectorTemplate = [
  '[data-mount][id',
  '],a[id',
  ']:not([href]),a[name',
  ']:not([href])',
];
export const MOUNT_SELECTOR: MountSelector = MOUNT_SELECTOR_TEMPLATE.join('');

const mountSelectorCache: MountSelectorCache = {};

function cachedMountSelector(cacheKey: string): MountSelector {
  if (!mountSelectorCache[cacheKey]) {
    mountSelectorCache[cacheKey] = MOUNT_SELECTOR_TEMPLATE.join(cacheKey);
  }

  return mountSelectorCache[cacheKey];
}

export function exactMountSelector(value: MountValue): MountSelector {
  return cachedMountSelector(`="${value}"`);
}

export function prefixedMountSelector(prefix: MountValuePrefix): MountSelector {
  return cachedMountSelector(`^="${prefix}"`);
}

function isNode(x: unknown): x is Node {
  return typeof x === 'object' && x instanceof Node;
}

function isElement(x: unknown): x is Element {
  return isNode(x) && x.nodeType === Node.ELEMENT_NODE;
}

export function isMount(x: unknown): x is Mount {
  return isElement(x) && x.matches(MOUNT_SELECTOR);
}

export function isExactMount(x: unknown, value: MountValue): x is Mount {
  return isElement(x) && x.matches(exactMountSelector(value));
}

export function isPrefixedMount(
  x: unknown,
  prefix: MountValuePrefix
): x is Mount {
  return isElement(x) && x.matches(prefixedMountSelector(prefix));
}

export function getMountValue(el: Mount): MountValue {
  return el.getAttribute('id') || el.getAttribute('name') || '';
}

export function getTrailingMountValue(
  el: Mount,
  prefix: MountValuePrefix
): MountValue {
  return getMountValue(el).slice(prefix.length);
}

function createBlockMountBasedOnInlineMount(
  el: DeprecatedInlineMount | InlineMount
): BlockMount {
  const blockEl: Element = document.createElement('div');

  blockEl.setAttribute('data-mount', '');
  blockEl.setAttribute(
    'id',
    el.getAttribute('id') || el.getAttribute('name') || ''
  );
  el.dataset.mountUsed &&
    blockEl.setAttribute('data-mount-used', el.dataset.mountUsed);

  return blockEl as BlockMount;
}

const ERROR_INLINE_MOUNT_HAS_NO_PARENT = 'Inline mount has no parent element';

export function ensureBlockMount(el: Mount): BlockMount {
  let blockEl: Mount = el;

  if (el.tagName === 'A') {
    const parentEl: Element | null = el.parentElement;

    if (parentEl === null) {
      throw new Error(ERROR_INLINE_MOUNT_HAS_NO_PARENT);
    }

    blockEl = createBlockMountBasedOnInlineMount(el);
    parentEl.insertBefore(blockEl, el);
    parentEl.removeChild(el);
  }

  return blockEl as BlockMount;
}

export function isUsed(mount: Mount): boolean {
  return !!mount.dataset.mountUsed;
}

function isUsedBy(mount: Mount): string | undefined {
  return mount.dataset.mountUsed;
}

export function useMount(mount: Mount): Mount {
  if (mount.dataset.mountUsed && mount.dataset.mountUsed !== INSTANCE_ID)
    throw new Error('Mount point already used.');
  mount.dataset.mountUsed = INSTANCE_ID;
  return mount;
}

export function selectMounts(
  selector: string,
  {
    exact = false,
    includeOwnUsed = false,
    markAsUsed = true,
    convertToBlock = false,
  }: Options = {}
): Mount[] {
  const s = exact
    ? exactMountSelector(selector)
    : prefixedMountSelector(selector);
  return Array.from(document.querySelectorAll(s))
    .filter(isMount)
    .filter(mount =>
      includeOwnUsed
        ? isUsedBy(mount) === INSTANCE_ID || !isUsed(mount)
        : !isUsed(mount)
    )
    .map(mount => {
      markAsUsed && useMount(mount);
      return convertToBlock ? ensureBlockMount(mount) : mount;
    });
}
