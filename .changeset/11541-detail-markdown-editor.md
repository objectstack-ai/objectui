---
'@object-ui/plugin-detail': patch
---

`record:details` edit mode gives a `markdown` field an editor: a multi-line
textarea (objectui#11541).

Before, a markdown row on the record page showed no pencil, and with the
section in edit mode it stayed a read-only cell with no editor at all. The
detail hosts consult the fields package's shared inline-edit exclusion, and
`markdown` is in it. A markdown field that no form names, such as a
`description` that is on no form, therefore had no editing surface anywhere in
the UI.

The detail row now routes `markdown` to `TextAreaField`, the fields package's
multi-line widget (the one a `textarea` field edits with in the record form),
through the same detail-side carve-out the upload widgets use
(`DETAIL_ROUTED_INLINE_TYPES`). The value is the markdown source, a plain
string. The textarea hands it back exactly as typed, blank lines and trailing
newline included, so a save writes back what was typed, byte for byte. It is a
plain textarea, with no rendered preview.

Unchanged: `html` and `richtext` still open no inline editor on the record
page, and a data-grid cell still opens none for `markdown`, `html` or
`richtext`.
