---
'@object-ui/app-shell': patch
---

fix(app-shell): the record page heading no longer prints a field the viewer may not read (objectui#10499)

The record page's heading is drawn by `page:header`, which builds it from the
record the page hands its blocks. The record page handed them the record as
served. On a backend that does not strip denied fields, a `titleFormat` token
or a declared `nameField` that the loaded permission policy denies therefore
printed in the heading, while the breadcrumb, the favourite and the
"Recently Accessed" entry already fell back to the next title source
(objectui#10434).

The record page now hands its blocks the record with the denied fields
removed, the record id always kept. That is the same record the breadcrumb
title reads, and the record ObjectStack's `FieldMasker` already serves. The
heading reads a denied field exactly as an absent one and falls through to its
next source. A template with a denied token renders what it renders when that
field is empty.

Under a denied single-field title, `record:details` already hid the `name`
row as the heading's duplicate while the heading printed the denied value, so
the readable name was on screen nowhere. The heading now shows that name, and
the hidden row is its duplicate again.

Every other block of the record page reads the same record, so on a
non-stripping backend a denied field now reads as absent there too (a
`record.*` visibility predicate, the path's current stage, a quick action's
predicate), exactly as on a stripping backend.

Before a permission policy loads, and with no permission provider mounted,
nothing is removed and the page is unchanged. This is defence in depth: on a
backend that strips denied fields, nothing changes.
