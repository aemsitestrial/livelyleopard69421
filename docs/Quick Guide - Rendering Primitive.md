# Quick Guide: Rendering a Block Inside Another Block

This guide shows how to render a **primitive block** (a small, single-purpose block) inside a
**composition block** (a bigger block built from other blocks).

The examples use these placeholder names. Replace them with your own blocks:

| Placeholder | Meaning | Real example |
|---|---|---|
| `my-primitive` | The primitive block being reused | `xe-logo` |
| `buildPrimitive` | The function that builds the primitive's element | `buildLogo` |
| `decoratePrimitive` | The name the composition gives the primitive's default `decorate()` when it imports it | `decorateLogo` |
| `my-composition` | The block that renders the primitive | `xe-navbar-v3` (not authorable), `teaser` (authorable) |

---

## Step 1: Make the primitive reusable

The primitive's JS has two parts:

- `buildPrimitive(props)` builds the element from plain settings (props).
- The default `decorate(block, props)` reads the authored settings from `block`, merges in any
  `props` it's given, and replaces the block's content with the built element.

Because `decorate()` takes an optional `props` argument, the same function runs the primitive
on its own and inside other blocks.

`blocks/my-primitive/my-primitive.js`

```js
import { getBlockProps } from '../../scripts/utils.js';

// Default value for each setting, in the same order as the model fields.
const DEFAULTS = { variant: 'primary', size: 'md' };

export function buildPrimitive(props = {}) {
  const el = document.createElement('my-primitive');
  Object.entries(DEFAULTS).forEach(([name, fallback]) => {
    el.setAttribute(name, String(props[name] || fallback).toLowerCase());
  });
  return el;
}

// Authored values come from the block. Props passed in by other blocks override them.
export default function decorate(block, props = {}) {
  block.replaceChildren(buildPrimitive({ ...getBlockProps(block, DEFAULTS), ...props }));
}
```

> Each setting is taken from `props` first, then from the authored content, then from
> `DEFAULTS`. `getBlockProps()` reads one value per child element of `block`, in `DEFAULTS`
> order.

---

## Step 2: Render the primitive in the composition block

Use this when the primitive is not authorable from the composition: its look is set in code
and the composition's model has no fields for it. This is how `xe-navbar-v3` renders its
brand logo.

In the composition block:

1. Import the primitive's default `decorate()` under a clear name, e.g. `decoratePrimitive`.
2. Create an empty container for the primitive.
3. Call `decoratePrimitive(container, props)` with the settings the composition wants.
4. Insert the container where the primitive should appear.

`blocks/my-composition/my-composition.js`

```js
import decoratePrimitive from '../my-primitive/my-primitive.js';

export default function decorate(block) {
  // ...decorate the composition's own content...

  // The primitive is not authored, so it gets an empty container of its own.
  const container = document.createElement('div');
  container.className = 'my-composition-primitive';
  decoratePrimitive(container, { variant: 'primary', size: 'md' });
  block.prepend(container);
}
```

> The container is empty, so there are no authored values to read. Every setting comes from
> the props you pass, then from `DEFAULTS`. Props are optional: `decoratePrimitive(container)`
> renders the primitive with its `DEFAULTS`.

---

## Step 3 (Optional): Let authors set the primitive from the composition

Use this when authors should pick the primitive's settings in the composition block. Add
the primitive's fields to the composition's model under a shared prefix (e.g. `logo_variant`,
`logo_size`) so they render together in one row. Then have the primitive decorate that row in
place, instead of creating a container.

`blocks/my-composition/_my-composition.json`

```json
{
  "definitions": [
    {
      "title": "My Composition",
      "id": "my-composition",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "My Composition",
              "model": "my-composition",
              "primitive_variant": "primary",
              "primitive_size": "md"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "my-composition",
      "fields": [
        {
          "component": "select",
          "name": "primitive_variant",
          "value": "primary",
          "label": "Primitive variant",
          "valueType": "string",
          "options": [
            { "name": "Primary", "value": "primary" },
            { "name": "Inverse", "value": "inverse" }
          ]
        },
        {
          "component": "select",
          "name": "primitive_size",
          "value": "md",
          "label": "Primitive size",
          "valueType": "string",
          "options": [
            { "name": "Small", "value": "sm" },
            { "name": "Medium", "value": "md" },
            { "name": "Large", "value": "lg" }
          ]
        }
      ]
    }
  ],
  "filters": []
}
```

> This model renders three rows. `imageAlt` is folded into the `image` row (row 0), the
> `textContent_` fields share one row (row 1), and the `primitive_` fields share one row
> (row 2), with one value per field in model order. The `primitive_` fields follow the same
> order as the primitive's `DEFAULTS` (`variant`, then `size`).

`blocks/my-composition/my-composition.js`

```js
import decoratePrimitive from '../my-primitive/my-primitive.js';

export default function decorate(block) {
  // The row index depends on where the primitive's fields sit in the composition model.
  const primitiveRow = block.children[2];

  // ...decorate the composition's own content...

  decoratePrimitive(primitiveRow);
}
```

> You don't need to append or remove anything. The row stays where it is, and its raw values
> are replaced by the primitive. Any value the row doesn't provide falls back to `DEFAULTS`.
> Authored values are matched to settings by position, so add the fields in the same order as
> `DEFAULTS` and don't skip any.

---

## Step 4 (Optional): Pass props with an authored row

Use this with Step 3 when the composition should set some of the primitive's settings itself,
for example to always use the inverse variant on a dark background. Pass them as the second
argument:

`blocks/my-composition/my-composition.js`

```js
import decoratePrimitive from '../my-primitive/my-primitive.js';

export default function decorate(block) {
  const primitiveRow = block.children[2];

  // ...decorate the composition's own content...

  decoratePrimitive(primitiveRow, { variant: 'inverse' });
}
```

> Passed props override what's authored in the row. Settings you don't pass still come from
> the row, then from `DEFAULTS`.

---

## Summary

| Step | Where | What |
|---|---|---|
| 1 | Primitive JS | Export `buildPrimitive(props)` with `DEFAULTS`, and a default `decorate(block, props)` that merges authored values with `props` |
| 2 | Composition JS | Not authorable: call `decoratePrimitive(container, { ... })` on a new empty container and insert it |
| 3 (optional) | Composition model + JS | Authorable: add the primitive's fields to the model and call `decoratePrimitive(row)` on the row that holds them |
| 4 (optional) | Composition JS | With an authored row, pass overrides: `decoratePrimitive(row, { ... })` |
