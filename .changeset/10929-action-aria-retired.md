---
'@object-ui/core': minor
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
that still carries it.

**Breaking, at the type level only.** Two names on the package root narrow:

- the `ActionDef` interface loses its `aria` member;
- the exported `ACTION_DEF_KEYS` constant loses its `'aria'` element, both in
  the runtime array and in its `as const` element union.

Code that compiled before and does not now:

- an explicit `aria: undefined` in an `ActionDef` object literal (an
  excess-property error);
- a read of `.aria` on an `ActionDef`;
- `'aria'` used as a `keyof ActionDef`, or as a `typeof ACTION_DEF_KEYS[number]`.

Every other `aria` value in an `ActionDef` literal was already a compile error,
because the member's type was `undefined`. The runtime accept set does not move:
nothing validates an `ActionDef` at runtime, and `KNOWN_ACTION_KEYS` still holds
`aria` through `SPEC_ACTION_KEYS`. Measured reach: this repository had no reader
of an action's `aria`, and CI `Type Check`, which compiles every workspace
consumer of `@object-ui/core`, is green with the member removed. The level is
`minor`, which is how this repository ships its own breaking changes.

The Studio action editor did not need a change: the served `action` schema from
17.5.0 on does not carry `aria`, so its "More fields" form offers no `aria`
control. A test in `@object-ui/app-shell` now pins that.
