---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): a field's `format` is read as a date pattern only on a `date` / `datetime` field

The dashboard table (`object-data-table`) and the record-detail drawer render a
value through `renderFieldValue`, whose date branch fired on any `format` string
containing one of the letters Y, M, D, H, m or s, whatever the field's type. A
text field hinted `format: 'email'` — which the shared cell-renderer resolver
promotes to a `mailto:` link — contains an `m`, so its address went to
`formatDate` and was painted as an em dash: the value disappeared. A text field
hinted `format: 'money'` holding a number rendered as a 1970 date, an
`autonumber` pattern with date tokens such as `ORD-{YYYYMMDD}-{00}` and a `time`
field's `HH:mm` rendered as an em dash, all with no error.

The branch now runs only when the field's type is `date` or `datetime`. Those
fields render exactly as before. A field of any other type no longer takes the
date branch and falls through to the cell renderer its type and `format` hint
select; the currency and percent branches ahead of it are unchanged. A column whose field
type is unknown — no object-schema field and no `type` on the column — is no
longer date-formatted from its `format` alone: declare `type: 'date'` on the
column to keep the date face.
