---
'@object-ui/data-objectstack': patch
---

Views that an earlier "Edit view config → Save" made read-only recover on read, and keep
their edits (objectui#10210).

A view row now counts as a personalization overlay only when it carries the `_isOverride`
marker. The view list used to treat a flat row carrying `viewKind: 'list'` as an overlay
too, a shape guess kept for toolbar rows written before the marker existed. A config save
on a code-defined view stored exactly that shape, so the view dropped out of the saved
views and its tab turned read-only, for good once the draft was published. With the guess
retired, such a row reads back as the saved view it is: its tab is editable again and shows
what the save stored. Nothing is rewritten at rest; the next read is enough.

⚠️ This exposes one class of row: overlay rows written before the marker
(objectui#4227, closed 2026-08-15) and never touched since. They have the same shape, so
they now also read as plain rows, and their frozen label, columns and filter copy covers
the code definition again. No deployment is named as holding one.
