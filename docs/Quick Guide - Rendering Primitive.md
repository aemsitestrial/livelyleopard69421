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

### The primitive's model

The primitive's settings are authored as **classes**: each field is named `classes_{setting}`
and each option value is prefixed with the setting name (`{setting}-{value}`). The selected
options are added to the block as classes, so an authored block looks like
`<div class="my-primitive variant-inverse size-lg">`.

`blocks/my-primitive/_my-primitive.json`

```json
{
  "definitions": [
    {
      "title": "My Primitive",
      "id": "my-primitive",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "My Primitive",
              "model": "my-primitive",
              "classes_variant": "variant-primary",
              "classes_size": "size-md"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "my-primitive",
      "fields": [
        {
          "component": "select",
          "name": "classes_variant",
          "value": "variant-primary",
          "label": "Variant",
          "valueType": "string",
          "options": [
            { "name": "Primary", "value": "variant-primary" },
            { "name": "Inverse", "value": "variant-inverse" }
          ]
        },
        {
          "component": "select",
          "name": "classes_size",
          "value": "size-md",
          "label": "Size",
          "valueType": "string",
          "options": [
            { "name": "Small", "value": "size-sm" },
            { "name": "Medium", "value": "size-md" },
            { "name": "Large", "value": "size-lg" }
          ]
        }
      ]
    }
  ],
  "filters": []
}
```

> `xe-logo` follows this pattern with three settings: `classes_variant` (`variant-primary`,
> `variant-inverse`), `classes_size` (`size-sm`, `size-md`, `size-lg`) and `classes_type`
> (`type-lockup`, `type-mark`). Remember to keep `component-definition.json` and
> `component-models.json` in sync with the block's `_*.json` file.

### The primitive's JS

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
  block.replaceChildren(buildPrimitive(getBlockProps(block, DEFAULTS, props)));
}
```

> Each setting is taken from `props` first, then from the authored content, then from
> `DEFAULTS`. For each setting not passed in `props`, `getBlockProps()`:
>
> 1. Looks for a class `{setting}-{value}` on `block` (e.g. `size-lg`) and uses `{value}`
>    (`lg`). This is how `classes_` fields are read, both in the primitive's own model and
>    in a composition's (see Step 3).
> 2. Otherwise reads the next authored value from the block's children, in `DEFAULTS` order.
> 3. Falls back to `DEFAULTS`.
>
> Only the option values are added to the block, not the field names, so what must match the
> `DEFAULTS` keys is the `{setting}-` prefix of each option value. Setting names are compared
> as class names (lowercased), so prefer lowercase setting names.

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

> The container has no children and no setting classes, so there are no authored values to
> read. Every setting comes from the props you pass, then from `DEFAULTS`. Props are optional:
> `decoratePrimitive(container)` renders the primitive with its `DEFAULTS`. Don't give the
> container a class that starts with a setting name (e.g. `size-...`), or it will be read as
> that setting.

---

## Step 3 (Optional): Let authors set the primitive from the composition

Use this when authors should pick the primitive's settings in the composition block. Add
the primitive's fields to the composition's model as `classes_` fields, with the same
`{setting}-{value}` option values as the primitive's own model. Give the fields names that
won't clash with the composition's own fields (e.g. `classes_primitiveVariant`); only the
option values end up on the block, so the field names don't need to match the primitive's.

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
              "classes_primitiveVariant": "variant-primary",
              "classes_primitiveSize": "size-md"
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
          "name": "classes_primitiveVariant",
          "value": "variant-primary",
          "label": "Primitive variant",
          "valueType": "string",
          "options": [
            { "name": "Primary", "value": "variant-primary" },
            { "name": "Inverse", "value": "variant-inverse" }
          ]
        },
        {
          "component": "select",
          "name": "classes_primitiveSize",
          "value": "size-md",
          "label": "Primitive size",
          "valueType": "string",
          "options": [
            { "name": "Small", "value": "size-sm" },
            { "name": "Medium", "value": "size-md" },
            { "name": "Large", "value": "size-lg" }
          ]
        }
      ]
    }
  ],
  "filters": []
}
```

> The selected options are added to the composition block as classes, e.g.
> `<div class="my-composition variant-inverse size-lg">`. `classes_` fields don't render a
> row, so they don't change the row indexes of the composition's other fields.

`classes_` fields put their classes on the composition block, not on an element the primitive
can decorate in place. So, as in Step 2, create a container for the primitive, then copy the
primitive's setting classes onto it so `decoratePrimitive()` reads them from there.

`blocks/my-composition/my-composition.js`

```js
import decoratePrimitive from '../my-primitive/my-primitive.js';

// The primitive's settings, authored on this block as "{setting}-{value}" classes.
const PRIMITIVE_SETTINGS = ['variant', 'size'];

export default function decorate(block) {
  // ...decorate the composition's own content...

  const container = document.createElement('div');
  container.className = 'my-composition-primitive';
  container.classList.add(...[...block.classList].filter(
    (className) => PRIMITIVE_SETTINGS.some((name) => className.startsWith(`${name}-`)),
  ));
  decoratePrimitive(container);
  block.prepend(container);
}
```

> The container has no children, so every setting comes from its copied classes, then from
> `DEFAULTS`. Settings are matched by class name, not by position, so the fields can be in
> any order and any of them can be left out.
>
> The primitive's classes share the composition block with the composition's own classes. If
> the composition has its own `{setting}-...` classes with the same setting names (e.g. its
> own `size-...`), they will be copied too, so keep those names distinct.

---

## Step 4 (Optional): Pass props with authored classes

Use this with Step 3 when the composition should set some of the primitive's settings itself,
for example to always use the inverse variant on a dark background. Leave those settings'
fields out of the composition model and pass them as the second argument:

`blocks/my-composition/my-composition.js`

```js
  // The model only has classes_primitiveSize; the variant is set here.
  decoratePrimitive(container, { variant: 'inverse' });
```

> Passed props override the authored classes. Settings you don't pass still come from the
> copied classes, then from `DEFAULTS`.

---

## Summary

| Step | Where | What |
|---|---|---|
| 1 | Primitive model + JS | Author settings as `classes_{setting}` fields with `{setting}-{value}` options. Export `buildPrimitive(props)` with `DEFAULTS`, and a default `decorate(block, props)` that calls `getBlockProps(block, DEFAULTS, props)` |
| 2 | Composition JS | Not authorable: call `decoratePrimitive(container, { ... })` on a new empty container and insert it |
| 3 (optional) | Composition model + JS | Authorable: add the primitive's fields to the model as `classes_` fields with `{setting}-{value}` options, copy those classes onto a new container and call `decoratePrimitive(container)` |
| 4 (optional) | Composition model + JS | With authored classes, set some settings in code: `decoratePrimitive(container, { ... })`, and leave those fields out of the model |
