---
'@object-ui/app-shell': minor
'@object-ui/core': minor
'@object-ui/i18n': minor
---

An action param that declares the spec's `carryOver` is shown read-only and submitted verbatim (objectui#6246)

`@objectstack/spec`'s `ActionParamSchema.carryOver` says a param's value is
carried through the action dialog rather than collected: seeded from the row
(`defaultFromRow: true` is required beside it), shown as a non-editable summary,
and submitted unchanged. The console dropped the key: `resolveActionParam()`
builds its output key by key and never copied it, so the dialog rendered every
such param as an ordinary editable field. The permission-set Clone action
declares it on its five JSON permission facets, so each of them — row-level
security among them — was a prefilled JSON textarea, and a hand edit that was
still valid JSON produced a clone granting more than its base.

- `@object-ui/core`: `ActionParamDef` gains `carryOver?: boolean`.
- `@object-ui/app-shell`: the resolver copies `carryOver` on all three of its
  branches; `ActionParamDialog` renders a declared carry-over as a collapsed
  read-only summary and builds no field widget for it at all; and
  `serializeParamValues` leaves a carry-over value untouched, even on an upload
  field.
- `@object-ui/i18n`: one new key, `actionDialog.carryOverHint`, in all ten packs.

Params that do not declare the key render and submit exactly as before.
