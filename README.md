# @abcnews/mount-utils

Utilities for working with mount points.

## Usage

```sh
npm i @abcnews/mount-utils
```

```html
<body>
  <div id="abc" data-mount />
  <a id="abc123" />
  <a name="def" />
  <a id="ghi" href="https://www.abc.net.au/news/">
    A link that is also a #ghi deep link
  </a>
  <p>Not a mount</p>
</body>
```

```js
import {
  MOUNT_SELECTOR,
  exactMountSelector,
  prefixedMountSelector,
  isMount,
  getMountValue,
} from '@abcnews/mount-utils';

[...document.querySelectorAll(MOUNT_SELECTOR)]
// > [<div id="abc" data-mount>, <a id="abc123">, <a name="def">]

[...document.querySelector(exactMountSelector('abc'))]
// > [<div id="abc" data-mount>]

[...document.querySelectorAll(prefixedMountSelector('abc'))]
// > [<div id="abc" data-mount>, <a id="abc123">]

[...document.body.children].filter(isMount).map(getMountValue);
// > ['abc', 'abc123, 'def']
```

## History

Core Media allows the creation of [deep links](https://en.wikipedia.org/wiki/URI_fragment) in Article documents' rich text by writing a line containing only a `#` character followed by one or more alphanumeric characters:

> I'm a paragraph before the deep link.
>
> #example
>
> I'm a paragraph after the deep link.

In Phase 1 / Phase 2 applications, deep links are rendered as `<a>` elements with their `name` attribute set to the deep link's value, e.g: `<a name="example" />`. Our original strategy with mount points was to select these elements with something like: `` (value) => document.querySelector(`a[name^="${value}"]`) ``, replace them with block elements (usually `<div>`s), then append interactive content to them.

When Presentation Layer was originally introduced, the News Web team had recognised that `<a name="example" />` is invalid HTML5, as deep links should be defined by the `id` attribute. Because of this, PL applications debuted with the HTML5-spec-pleasing form: `<a id="example" />`.

This made things slightly more complicated, because although we could simply extend our selectors to `` `a[name^="${value}"],a[id^="${value}"]` `` and cover both variants, we'd have to update many older interactives/libraries to support the new pattern if we wanted them to have a chance of running atop PL. It would also be more dangerous to replace these elements with `<div>`s to mount interactives to, because PL's React DOM tree could be re-written at any point, reverting our modifications (or worse: introducing page-crashing bugs).

An effort to support mount points as a first-class citizen in PL began in early 2020, and has resulted in changes in how PL renders deep links on the News Web application, making them safer for our use. They are now `<div>` elements that are guaranteed to not revert any DOM structure appended to them. They now look like this: `<div id="example" data-mount />`.

Of course, this complicates our mount point selection further, which is the main thing this library tries to address (by hiding the implementation details behind an API), but it'll give us more power and consistency, going forward.

## API

### `MOUNT_SELECTOR`

This is a catch-all selector for mount points across all applications.

```js
import { MOUNT_SELECTOR } from '@abcnews/mount-utils';

console.log(MOUNT_SELECTOR);
// > "[data-mount][id],a[id]:not([href]),a[name]:not([href])"
```

Coupled with `document.querySelector`, it will return elements such as:

- `<div id="abc" data-mount />`,
- `<a id="def" />` and
- `<a name="ghi" />`

### `exactMountSelector(value: string): string`

Generate a mount selector for the given `value`. It looks similar to `MOUNT_SELECTOR`, but includes an 'attribute equals' pattern for each of the applicable attributes.

```js
import { exactMountSelector } from '@abcnews/mount-utils';

exactMountSelector('abc');
// > "[data-mount][id="abc"],a[id="abc"]:not([href]),a[name="abc"]:not([href])"
```

This function is memoised, so subsequent calls with the same `value` will fetch their response from a cache of selectors to improve performance.

### `prefixedMountSelector(prefix: string): string`

Generate a mount selector for the given `prefix`. It looks similar to `MOUNT_SELECTOR`, but includes an 'attribute value starts with' pattern for each of the applicable attributes.

```js
import { prefixedMountSelector } from '@abcnews/mount-utils';

prefixedMountSelector('abc');
// > "[data-mount][id^="abc"],a[id^="abc"]:not([href]),a[name^="abc"]:not([href])"
```

Coupled with `document.querySelector`, the above example would match elements such as:

- `<div id="abc" data-mount />`,
- `<a id="abc123" />` and
- `<a name="abcDEF" />`

This function is memoised, so subsequent calls with the same `prefix` will fetch their response from a cache of selectors to improve performance.

### `isMount(x: unknown): boolean`

Returns whether the argument passed in is a mount point.

```html
<body>
  <div id="abc" data-mount />
</body>
```

```js
import { isMount, MOUNT_SELECTOR } from '@abcnews/mount-utils';

isMount(123);
// > false
isMount(document.body);
// > false
isMount(document.body.firstElementChild);
// > true
```

It first checks that the argument is an Element, then checks that it matches `MOUNT_SELECTOR`.

### `isExactMount(x: unknown, value: string): boolean`

Returns whether the first argument passed in is a mount point with the given `value`.

This works the same as `isMount`, but matches against `exactMountSelector(value)`, rather than `MOUNT_SELECTOR`.

For the JS example below, assume the following DOM exists:

```html
<body>
  <p>Nope</p>
  <a name="abc" />
  <a id="abc123" />
  <div id="abc456" data-mount />
  <div id="def" data-mount />
</body>
```

```js
import { isExactMount, MOUNT_SELECTOR } from '@abcnews/mount-utils';

[...document.body.children].map((el) => isExactMount(el, 'abc'));
// > [false, true, false, false, false]
```

### `isPrefixedMount(x: unknown, prefix: string): boolean`

Returns whether the argument passed in is a mount point with the given `prefix`.

This works the same as `isMount`, but matches against `prefixedMountSelector(prefix)`, rather than `MOUNT_SELECTOR`.

```html
<body>
  <p>Nope</p>
  <a name="abc" />
  <a id="abc123" />
  <div id="abc456" data-mount />
  <div id="def" data-mount />
</body>
```

```js
import { isPrefixedMount, MOUNT_SELECTOR } from '@abcnews/mount-utils';

[...document.body.children].map((el) => isPrefixedMount(el, 'abc'));
// > [false, true, true, true, false]
```

### `getMountValue(el: Element): string`

Returns the value of the applicable attribute on a mount point.

```html
<body>
  <a name="abc" />
  <a id="def" />
  <div id="ghi" data-mount />
</body>
```

```js
import { getMountValue } from '@abcnews/mount-utils';

[...document.body.children].map((el) => getMountValue(el));
// > ['abc', 'def, 'ghi']
```

### `getTrailingMountValue(el: Element, prefix: string): string`

Returns the value of the applicable attribute a the mount point, with the `prefix` removed.

```html
<body>
  <a name="abc" />
  <a id="abcdef" />
  <div id="abc123" data-mount />
</body>
```

```js
import { getTrailingMountValue } from '@abcnews/mount-utils';

[...document.body.children].map((el) => getTrailingMountValue(el));
// > ['', 'def, '123']
```

### `ensureBlockMount(el: Element): Element`

Ensures that we have a block mount (matching `div[id][data-mount]`) to work with (usually in order to append content).

#### DOM Before

```html
<body>
  <a name="abc" />
  <a id="def" />
  <div id="ghi" data-mount />
</body>
```

```js
import { ensureBlockMount } from '@abcnews/mount-utils';

[...document.body.children].map((el) => ensureBlockMount(el));
// > [<div id="abc" data-mount>, <div id="def" data-mount>, <div id="ghi" data-mount>]
```

#### DOM After

```html
<body>
  <div id="abc" data-mount />
  <div id="def" data-mount />
  <div id="ghi" data-mount />
</body>
```

If the mount passed in is a block mount, it is returned as-is.

If the mount passed in is an inline mount (matching `a[id]` or `a[name]`), it is replaced in the DOM by a newly created block mount (retaining the original value), which is then returned.

_Note: If an inline mount is passed in which doesn't have a parent element (to facilitate replacement), an error is thrown._

```js
import { ensureBlockMount } from '@abcnews/mount-utils';

let el = document.createElement('a');

el.name = 'abc';
el = ensureBlockMount(el);
// > (error: Inline mount has no parent element)
```

Think of `ensureBlockMount` as a normalisation function that will enable you to target (and style) all mount points as if they were Presentation Layer's first-class mount points. It's sometimes easier to work with them in this way, rather than having to consider three different forms throughout your codebase.

## Authors

- Colin Gourlay ([Gourlay.Colin@abc.net.au](mailto:Gourlay.Colin@abc.net.au))
