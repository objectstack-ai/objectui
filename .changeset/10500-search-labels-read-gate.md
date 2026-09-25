---
'@object-ui/react': patch
'@object-ui/app-shell': patch
---

fix(react,app-shell): a search hit's label no longer prints a field the viewer may not read (objectui#10500)

The ⌘K command palette, the full-page search results and the `global:search`
block label each record hit with `getRecordDisplayName`, and `useRecordSearch`
handed that resolver the record as served. On a backend that does not strip
denied fields, a `titleFormat` token or a declared `nameField` that the loaded
permission policy denies therefore printed as the hit's label.

`useRecordSearch` takes a new optional `fieldReadPolicy` option: pass
`usePermissions()` from `@object-ui/permissions`. Once that policy is loaded,
each hit is labelled from its record with the denied fields removed, before any
`getDisplayName` resolver reads it. The record id is always kept, so the
`Record #` id floor still applies. A denied field is read exactly as an absent
one, and the label falls through to its next source, the label ObjectStack's
`FieldMasker` row already yields. When the policy finishes loading, a search
that is already showing runs again, so hits labelled before the policy loaded
are relabelled. The three app-shell search surfaces now pass the policy. The
record title (objectui#10434) and the lookup option label (objectui#10411)
follow the same rule.

Without the option, before a policy loads, and with no permission provider
mounted, nothing is removed and every label is unchanged. A title the server
computed for a `searchAll` hit is still shown as the server sent it, and a
hit's `raw` payload is still the record as served.

This is defence in depth: ObjectStack's `FieldMasker` already removes the
fields a user may not read from the rows it serves, so on that backend no
label changes.
