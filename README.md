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
  isMount,
  getMountValue,
  selectMounts
} from '@abcnews/mount-utils';

selectMounts();
// > [<div id="abc" data-mount>, <div id="abc123" data-mount>, <div id="def" data-mount>]

selectMounts('abc', {exact: true})
// > [<div id="abc" data-mount>]

selectMounts('abc')
// > [<div id="abc" data-mount>, <div id="abc123" data-mount>]

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

### `selectMounts(selector?: string, options?: SelectMountsOptions): Mount[]`

Returns an array of mount nodes that match the selector and may have been transformed as per the supplied options.

```ts
type SelectMountsOptions{
  exact?: boolean; // default false
  includeOwnUsed?: boolean; // default false
  markAsUsed?: boolean; // default true
}
```

Any mount points that have been marked as used by another instance of this library will always be excluded from the results.

The examples below assume that they're run in isolation. In reality, unless the `markAsUsed` option is `false` and/or the `includeOwnUsed` option is `true`, the same mounts would not be returned on a subsequent call.

```html
<body>
  <div id="abc" />
  <div id="abcdef" />
  <div id="ghi" data-mount />
  <div id="abc123" data-mount />
  <div id="other" data-mount data-mount-used="some-uuid" />
</body>
```

```js
import { selectMounts } from '@abcnews/mount-utils';

selectMounts();
// > [<div id="abc">, <div id="abcdef">, <div id="ghi">, <div id="abc123">]

selectMounts('abc');
// > [<div id="abc">, <div id="abcdef">, <div id="abc123">]

selectMounts('abc', { exact: true });
// > [<div id="abc">]
```

### `isMount(x: unknown, selector?: string, exact?: boolean): boolean`

Returns whether the argument passed in is a mount point.

Will return `true` for valid mount points even if marked as used, including those marked by another instance of this library.

```html
<body>
  <div id="abc" data-mount />
</body>
```

```js
import { isMount } from '@abcnews/mount-utils';

isMount(123);
// > false

isMount(document.body);
// > false

isMount(document.body.firstElementChild);
// > true
```

It first checks that the argument is an `Element`, then checks that it has attributes matching a valid mount point.

#### Use with a selector value

Returns whether the first argument passed in is a mount point _and_ matches a given selector value (as a prefix by default and optionally as an exact match by passing `true` as the third argument).

```html
<body>
  <p>Nope</p>
  <div id="abc" />
  <div id="abc123" />
  <div id="abc456" data-mount />
  <div id="def" data-mount />
</body>
```

```js
[...document.body.children].map((el) => isMount(el));
// > [false, true, true, true, true]

[...document.body.children].map((el) => isMount(el, 'abc'));
// > [false, true, true, true, false]

[...document.body.children].map((el) => isMount(el, 'abc', true));
// > [false, true, false, false, false]
```

### `getMountValue(el: Element, prefix?: string): string`

Returns the value of the applicable attribute on a mount point and optionally trims a supplied prefix.

```html
<body>
  <div id="abc" />
  <div id="abcdef" />
  <div id="ghi" data-mount />
  <div id="abc123" data-mount />
</body>
```

```js
import { getMountValue } from '@abcnews/mount-utils';

[...document.body.children].map((el) => getMountValue(el));
// > ['abc', 'abcdef, 'ghi', 'abc123']

[...document.body.children].map((el) => getMountValue(el, 'abc'));
// > ['', 'def, 'ghi', '123']
```

### `useMount(mount: Mount)`

Mark a mount as used. This should be used sparingly since `selectMounts` will do this automatically by default.

A mount is considered used if it has a `data-mount-used="<some uuid>"` attribute set. The UUID is unique to the instance of this library.

```html
<body>
  <div id="abc" data-mount />
</body>
```

```js
const els = selectMounts('abc', { markAsUsed: false });
// > [<div id="abc" data-mount>]

useMount(els[0]);
// > <div id="abc" data-mount data-mount-used="<uuid>">
```

### `isUsed(mount: Mount)`

Check if a mount point has been marked as used.

```html
<body>
  <div id="abc" data-mount />
</body>
```

```js
selectMounts('abc').map((mnt) => isUsed(mnt));
// > [true]

selectMounts('abc', { markAsUsed: false }).map((mnt) => isUsed(mnt));
// > [false]
```

## Authors

- Colin Gourlay ([Gourlay.Colin@abc.net.au](mailto:Gourlay.Colin@abc.net.au))
- Simon Elvery ([Elvery.Simon@abc.net.au](mailto:Elvery.Simon@abc.net.au))
