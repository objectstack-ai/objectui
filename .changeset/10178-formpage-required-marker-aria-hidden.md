---
'@object-ui/console': patch
---

fix(console): `FormPage`'s required `*` no longer lands in the control's accessible name

`/f/:slug` and `/forms/:name` render through `FormPage`, which draws the required
marker as a `*` inside the field's `label`. The label is the control's accessible
name, so a screen reader announced "Title *" instead of "Title". The marker is
now `aria-hidden`, the rule `ActionParamDialog` already follows (objectui#3299):
the requirement is announced as a state on the control, and the `*` is for
sighted users only.

The text-like, number, date/time, select and textarea controls already carried
native `required`, and the `file` control `aria-required`, so they still announce
it. The checkbox control carried neither, so it now gets `aria-required`. It does not get native `required`: on a checkbox
that means "must be checked", and the required rule counts `false` as a value.
