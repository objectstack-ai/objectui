---
'@object-ui/plugin-form': patch
'@object-ui/components': patch
---

fix(plugin-form,components): an edit-mode `object-master-detail-form`'s detail lines and `element:record_picker`'s options re-read on the data-invalidation bus

An `object-master-detail-form` in edit mode now reads the bus for each detail
collection's child object: a write declared there (`notifyDataChanged`, as a
page action over raw HTTP does), or an unscoped `'*'`, re-reads that
collection's lines in place, and the rows and the baseline the next save diffs
against move together. A collection only re-reads for its own child object. The
header already re-read through its own form. While a collection holds lines the
user has not saved (lines the next save would write), its re-read is held: it
runs once after the lines are changed back to what is stored, or once this
form's save lands. A line typed while a re-read is in flight is kept, and the
re-read is held behind it. A re-read that fails keeps the lines on screen.
`object-form` with `subforms`, which renders the same form, re-reads the same
way.

`element:record_picker` now re-reads its options when the bus reports a write to
the object it queries. The re-read keeps the control enabled over the options on
screen (no "Loading…") and never touches the bound page variable. If the bound
record is no longer among the options, the variable keeps its value and the
control shows no label until a later read offers that record again.

Before, both refreshed after such a write only when their host remounted them,
and `PageView` is about to stop doing that (objectui#10519).
