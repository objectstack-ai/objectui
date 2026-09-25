---
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
---

fix(plugin-detail,app-shell): a record's title no longer prints a field the viewer may not read (objectui#10434)

`DetailView` hid the row of every field the loaded permission policy denies,
but it built its header title from the record as served. On a backend that
does not strip denied fields, a `titleFormat` token, a declared `nameField` or
a view `primaryField` that the policy denies therefore printed in the heading
while its row was hidden. The record page built its breadcrumb title the same
way, and the favourite and the "Recently Accessed" entry carry that title.

Both titles are now built from the record with the denied fields removed. The
record id is always kept, so the `Record #` id floor still applies. A denied
field is read exactly as an absent one, and the title falls through to its
next source, the title ObjectStack's `FieldMasker` row already yields. No
placeholder stands in for a withheld value. A template with a denied token
renders what it renders when that field is empty.

`record:details` hides the one body row that repeats the title, and it now
makes that choice from the same row. With the block's own header
(`showHeader: true`), the heading and that choice therefore read the same
record, and a denied title field no longer leaves the fallen-through title's
row printed directly under the heading. ⚠️ Under a
`page:header`, which still builds its heading from the record as served, the
body now matches what a stripping backend renders. The heading can still
print the denied value there, and the row hidden is then the one a stripping
backend's heading would show.

Before a permission policy loads, and with no permission provider mounted,
nothing is removed and every title is unchanged.

This is defence in depth: ObjectStack's `FieldMasker` already removes the
fields a user may not read from the rows it serves, so on that backend no
title changes.
