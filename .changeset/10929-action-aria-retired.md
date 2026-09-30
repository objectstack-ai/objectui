---
'@object-ui/core': patch
---

fix(core): `ActionDef` no longer declares `aria`, which `@objectstack/spec` 17.5.0 retired on an action

`@objectstack/spec` 17.5.0 retired `action.aria` as a `retiredKey()` tombstone:
authoring it is a parse rejection, because no action surface ever applied it.
The accessible name an action gets is its `label`. To name the region that
places the actions, use the `aria` block of the placing node.

`ActionDef` (`@object-ui/core`) mirrored the key as `aria?: SpecActionInput['aria']`.
After the 17.5.0 bump that type resolved to `undefined`, so the field mirrored
nothing. It is removed, and so is its entry in the exported `ACTION_DEF_KEYS`
inventory. `aria` stays in `SPEC_ACTION_KEYS`, because the spec still declares
the tombstone, so the dev-mode unknown-key warning does not change for an action
that still carries it. No reader of an action's `aria` existed in this
repository.

For code that assigns `aria` to an `ActionDef`, the compile error changes from a
type mismatch against `undefined` to an excess-property error. Any value was
already refused.

The Studio action editor did not need a change: the served `action` schema from
17.5.0 on does not carry `aria`, so its "More fields" form offers no `aria`
control. A test in `@object-ui/app-shell` now pins that.
