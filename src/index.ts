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

export type Mount = BlockMount;

type SelectMountsOptions = {
  exact?: boolean;
  includeOwnUsed?: boolean;
  markAsUsed?: boolean;
  convertToBlock?: boolean;
};

interface MountSelectorCache {
  [key: string]: MountSelector;
}

const ERROR_MOUNT_ALREADY_USED = 'Mount point already used.';

// https://gist.github.com/LeverOne/1308368
// Small local implementation to avoid a dependency
const INSTANCE_ID: string = ((): string => {
  let a = 0,
    b;
  for (
    b = '';
    a++ < 36;
    b +=
      (a * 51) & 52
        ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16)
        : '-'
  );
  return b;
})();

const MOUNT_SELECTOR_TEMPLATE: MountSelectorTemplate = ['[data-mount][id', ']'];
const MOUNT_SELECTOR: MountSelector = MOUNT_SELECTOR_TEMPLATE.join('');

const mountSelectorCache: MountSelectorCache = {};

function cachedMountSelector(cacheKey: string): MountSelector {
  if (!mountSelectorCache[cacheKey]) {
    mountSelectorCache[cacheKey] = MOUNT_SELECTOR_TEMPLATE.join(cacheKey);
  }

  return mountSelectorCache[cacheKey];
}

function exactMountSelector(value: MountValue): MountSelector {
  return cachedMountSelector(`="${value}"`);
}

function prefixedMountSelector(prefix: MountValuePrefix): MountSelector {
  return cachedMountSelector(`^="${prefix}"`);
}

function isNode(x: unknown): x is Node {
  return typeof x === 'object' && x instanceof Node;
}

function isElement(x: unknown): x is Element {
  return isNode(x) && x.nodeType === Node.ELEMENT_NODE;
}

export function isMount(
  x: unknown,
  value?: string,
  exact: boolean = false
): x is Mount {
  return (
    isElement(x) &&
    (value === undefined
      ? x.matches(MOUNT_SELECTOR)
      : exact
      ? x.matches(exactMountSelector(value))
      : x.matches(prefixedMountSelector(value)))
  );
}

export function getMountValue(el: Mount, value: string = ''): MountValue {
  // The filter here is inline with what's possible as anchor IDs in PL https://stash.abc-dev.net.au/projects/PL/repos/pl/commits/01a159f206d1f5f2e34f5424a767fc373a21b669#libraries/rich-text-from-terminus-text/src/visitors/convertHashtagToAnchor.js
  const re = new RegExp(`^${value.replace(/[^\w.\-:]/g, '')}`);
  return (el.getAttribute('id') || el.getAttribute('name') || '').replace(
    re,
    ''
  );
}

export function isUsed(mount: Mount): boolean {
  return !!mount.dataset.mountUsed;
}

function isUsedBy(mount: Mount): string | undefined {
  return mount.dataset.mountUsed;
}

export function useMount(mount: Mount): Mount {
  if (mount.dataset.mountUsed && mount.dataset.mountUsed !== INSTANCE_ID)
    throw new Error(ERROR_MOUNT_ALREADY_USED);
  mount.dataset.mountUsed = INSTANCE_ID;
  return mount;
}

export function selectMounts(
  selector?: string,
  {
    exact = false,
    includeOwnUsed = false,
    markAsUsed = true,
  }: SelectMountsOptions = {}
): Mount[] {
  const s =
    selector !== undefined
      ? exact
        ? exactMountSelector(selector)
        : prefixedMountSelector(selector)
      : MOUNT_SELECTOR;
  return Array.from(document.querySelectorAll(s))
    .filter((el): el is Mount => isMount(el))
    .filter((mount) =>
      includeOwnUsed
        ? isUsedBy(mount) === INSTANCE_ID || !isUsed(mount)
        : !isUsed(mount)
    )
    .map((mount) => {
      markAsUsed && useMount(mount);
      return mount;
    });
}
