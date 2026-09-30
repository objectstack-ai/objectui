---
'@object-ui/app-shell': patch
---

fix(app-shell): the metadata form routes a condition builder to a member the served derivation marks as an erased string arm

`/meta/types` serves the output derivation, and every expression-input slot
(`hook.condition`, `sharing_rule.condition`, `field.visibleWhen` /
`readonlyWhen` / `requiredWhen`, a flow edge's `condition`, …) has a string arm
that is a transform, so the served schema carries `{}` where that arm was. `{}`
reads as "admits anything", so the metadata form's shape test vetoed it and the
condition builder mounted for none of those slots.

From `@objectstack/metadata-protocol` 17.5.0 the served projection marks such an
arm in place with `x-objectstack-erased-authoring-input: { version: 1, type }`,
naming the authoring type the transform erased. The form's shared shape test now
reads that mark: an arm marked as an erased `string` counts as a string arm, so a
served predicate slot gets the condition builder. The read is strict — a mark
naming another type, a mark of an unknown version, and an unmarked `{}` all keep
the veto. An explicit `widget` in the form spec still decides outright, in both
directions, and no key name is treated as evidence of a type.
