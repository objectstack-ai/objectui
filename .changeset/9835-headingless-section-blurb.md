---
'@object-ui/plugin-form': patch
---

Render a headingless section's `description` in the default (grouped) form layout
(objectui#9835, maintainer ruling 2026-09-18, letter B).

A form section that authored a `description` and neither `name` nor `label` lost its
blurb on the default layout — the one a section-carrying `object-form` gets when it
declares no `formType`. That layout pushes its `section-divider` row only for a member
that yields a heading, so a member with no heading had nothing to carry the blurb on.
The `split`, `modal`, `wizard` and `tabbed` arms all rendered it, so one authored
section rendered differently depending only on which arm the host chose.

Such a member now gets a **blurb-only** row: it carries the `description` and nothing
else. In particular it does **not** carry the ADR-0089 `visibleWhen` predicate, the
objectui#6236 membership claim that gates the whole group, or the
`collapsed` / `collapsible` pair. Widening the heading gate instead (the obvious
one-line fix) was considered and refused: that same condition implements those three
semantics, so widening it would let an untitled section's predicate hide its group and
let an untitled `collapsed: true` remove its fields from the DOM with no control to
bring them back — a decision about two other keys, taken while fixing a blurb.

**What changes for authors.** A section with a `description` and no title now shows
that text on every layout arm instead of four out of five. Nothing else moves: a titled
section renders exactly as before, and an untitled section's `visibleWhen`, `collapsed`
and `collapsible` keep doing exactly what they did (nothing) on this layout.
