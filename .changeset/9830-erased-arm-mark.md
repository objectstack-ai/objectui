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

This completes the half that the nested-`anyOf` entry for objectui#9830 left
open: that entry's statement that the husk gets no condition builder now holds
for an UNMARKED husk only.

From `@objectstack/metadata-protocol` 17.5.0 the served projection marks such an
arm in place with `x-objectstack-erased-authoring-input: { version: 1, type }`,
naming the authoring type the transform erased. The form's shared shape test now
reads that mark: an arm marked as an erased `string` counts as a string arm, so a
served predicate slot gets the condition builder. The read is strict — a mark
naming another type, a mark of an unknown version, and an unmarked `{}` all keep
the veto. An explicit `widget` in the form spec still decides outright, in both
directions, and no key name is treated as evidence of a type.

What an author sees against a 17.5.0 or later backend: a hook's `condition` and
a field's `visibleWhen` / `readonlyWhen` / `requiredWhen`, whose served form rows
declare `type: 'code'` rather than a `widget`, now open in the condition builder
(visual rows plus its raw-expression mode) instead of the plain code editor; a
sharing rule's `condition`, which has no served form row, gets the builder
instead of a plain text area. Against an older backend nothing is marked and
nothing changes.
