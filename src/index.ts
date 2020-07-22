type MountValue = string;
type MountValuePrefix = string;
type MountSelector = string;
type MountSelectorTemplate = string[];
type BlockMount = Element & {
  tagName: 'DIV';
  id: MountValue;
  'data-mount': string;
};
type DeprecatedInlineMount = Element & {
  tagName: 'A';
  id: MountValue;
};
type InlineMount = Element & {
  tagName: 'A';
  name: MountValue;
};

type Mount = BlockMount | DeprecatedInlineMount | InlineMount;

interface MountSelectorCache {
  [key: string]: MountSelector;
}

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

// Polyfill Element.prototype.matches, if required
if (!Element.prototype.matches) {
  Element.prototype.matches =
    // @ts-ignore: Property 'msMatchesSelector' does not exist on type 'Element'
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
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
