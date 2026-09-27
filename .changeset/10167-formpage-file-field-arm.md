---
'@object-ui/console': patch
---

fix(console): a `file` field on a FormView renders the shared upload control, not a text box

`/f/:slug` and `/forms/:name` render through `FormPage`, whose hand-rolled input
switch had no `file` arm — so a `file` field fell through to the default text
input. Typing a filename into a text box uploads nothing, which made the
capability absent on those two routes rather than merely degraded.

The arm does not hand-roll a second file control. It asks ADR-0059's resolver
(`resolveFormWidgetType` + `getLazyFieldWidget` in `@object-ui/fields`, the door
`@object-ui/app-shell`'s `ActionParamDialog` is already on) for the same widget
the record form renders, so the value this route submits is the one the other
renderer submits: the `sys_file` id the upload adapter minted, or the legacy
inline blob when the adapter surfaced none.

Two supporting halves, both in the same file. The object field's declared
`multiple`, `accept` and `maxSize` now reach the widget — this app's narrowed
view of the object payload admitted none of the three, so the control would have
been single-file, unfiltered and unbounded whatever the author wrote. And submit
is blocked while an upload is in flight, which is what the widget contract's
`onUploadingChange` exists for: a file's value only becomes an id once the
adapter settles, so a submit that beats it stores nothing and still reports
success.

⛔ The other field types this switch does not spell are untouched. Which ones
those are is enumerated on objectui#10167, for the separate decision about
whether this renderer should hold a switch at all.

⚠️ **Dated note, 2026-09-27 — a no-id pick is now refused in the widget, not submitted as an inline blob — objectui#7699.**

The paragraph above describes this route's write at the time it was written. Since objectui#7699, a pick whose adapter surfaced no id is refused in the widget and never submitted as an inline blob; the value this route submits is only ever the `sys_file` id the upload adapter minted, never the legacy inline blob. The rest of this entry is kept as the reading of this change; objectui#7699's own changeset states what a no-id pick does now.
