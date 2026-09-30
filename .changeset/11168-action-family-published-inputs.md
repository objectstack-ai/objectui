---
'@object-ui/components': minor
---

The four `action:*` blocks now publish the `@objectstack/spec` keys their
renderers honour, and stop publishing what the spec refuses (objectui#11168,
slice 1). Each key was decided by measuring it through `SchemaRenderer` and the
action runner, per the objectui#11111 ruling: declare what the block path
honours, refuse or retire what it does not.

Newly published, so the SDUI manifest, the JSX intrinsics and the page
validator accept them instead of reporting `unknown-prop`:

- `action:button` and `action:icon`: `visible`, `disabled`, `params`,
  `description`, `openIn`, `method`, `bodyExtra`, `bodyShape`, `operation`,
  `patch`, `confirmText`, `successMessage`, `errorMessage`, `refreshAfter`,
  `locations`, `toast`, `resultDialog`, `onSuccess` and `objectName`; and
  `recordIdField` on `action:button`. `params` is published as the list of
  parameters to collect; static execution values stay under
  `properties.params`.
- `action:group`: `location` and `visible`.
- `action:menu`: `size` and `visible`.

Retired and narrowed (breaking for an author who wrote them, which the spec
already refuses):

- `action:group` no longer publishes `name`. Nothing reads a group-level
  `name`; each member action's own `name` identifies it.
- `actions` on `action:group` and `action:menu` is published as a list of action
  objects, not an `object`. Both blocks read the key as a list, so an object
  there could not render.
- `action:group.size` publishes `default`, `sm`, `lg` and `icon`, and no longer
  `md`. A stored `md` still renders as before.

Still unpublished, pending a decision on objectui#11168: `endpoint` on
`action:button` and `action:icon`, and `undoable` on `action:button`. The
renderers keep forwarding both, so nothing changes at runtime.
