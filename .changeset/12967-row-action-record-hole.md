---
'@object-ui/core': minor
'@object-ui/app-shell': patch
---

A row action's templates read the row as `record`, the way the record header's do (objectui#12967).

The same action's `confirmText` with `${record.display_name}` read filled from a record header and as template source from a list row: the header binds `record` in the action runner's context, while a row surface (a grid row, a related-list row, `DeclaredActionsBar`, a page header, `action:button`'s update write) stashes the row under `params._rowRecord` and binds nothing. The runner now binds a dispatch's `_rowRecord` as `record` for that dispatch's templates, the row winning over a page-level `record`. A hole naming a field the record does not carry prints empty on both doors, as it always has on the header.

The param dialog's `description` and each param's `helpText` are filled in the same scope, on both doors. Before, neither door filled them. The runner hands the param-collection handler an `interpolate` function; the console's two handlers apply it to the localized description (never to the admin-override notice, whose approver names are data) and pass it to `ActionParamDialog`, which applies it to the `helpText` the user reads, after an inline per-locale map is picked.

A toast's `${result.*}` is unchanged. No action key is added.

**Clause-②: yes (widening).** The exported `ParamCollectionHandler` type in `@object-ui/core` gains an optional third parameter, `interpolate?: (text: string) => string`. A handler that ignores it reads exactly as before. `ActionParamDialog`'s state type gains one optional member, `interpolate`; that type is not in `@object-ui/app-shell`'s barrel.
