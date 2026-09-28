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
user has changed since they were last read or saved (compared the way the save
compares rows, with the link to the parent set aside), or while the row editor
("Open row") is open on it, its re-read is held. It runs once, when the row
editor is closed and either the lines have been changed back or this form's
save has landed. A line typed while a re-read is in flight, in the grid or in
the row editor, is kept, and the re-read is held behind it; an open row editor
is never reset by a re-read. A re-read that fails keeps the lines on screen.
`object-form` with `subforms`, which renders the same form, re-reads the same
way.

`element:record_picker` now re-reads its options when the bus reports a write to
the object it queries. The re-read keeps the control enabled over the options on
screen (no "Loading…") and never touches the bound page variable. If the bound
record is no longer among the options, the variable keeps its value and the
control shows no label until a later read offers that record again.

Before, both refreshed after such a write only when their host remounted them,
and `PageView` is about to stop doing that (objectui#10519).
