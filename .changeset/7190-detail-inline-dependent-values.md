---
'@object-ui/plugin-detail': minor
---

Fix: a `dependsOn` field is no longer permanently gated when it is edited inline
on a record's detail page.

A lookup declaring `dependsOn: ['region']` rendered a disabled trigger reading
"Select region first" in inline edit — while the `region` it asked for was on
screen, filled, in the same edit session. The field could never be filled
there. A `select` or multi `select` field declaring `dependsOn` was withheld the
same way, behind its "select the parent first" hint. Both the details body and
the highlights strip were affected.

The widgets in `@object-ui/fields` resolve the record they cascade on from one
channel, the `dependentValues` prop their host passes; there is no context
fallback (objectui#7206). `InlineFieldInput` — the one inline editor both
record-page surfaces share — passed none. It now takes an optional
`dependentValues` prop and forwards it to `LookupField` / `UserField`,
`SelectField` and `FieldEditWidget`, and both of its call sites pass the record:
`DetailSection` the record `DetailView` already merges with the inline draft,
and `HeaderHighlight` the saved record overlaid with the same draft. The
highlights strip now also reads each field's own value by that same overlay, so
a draft entry that holds an emptied value shows as empty there, exactly as it
does in the details body.

The record is the STAGED one — the same answer the grid's inline editor gives
(objectui#7188) and the form's live watched record: a parent edited in the same
session re-scopes the child before anything is saved, and clearing the parent
re-gates the child.

⚠️ Entering inline edit can now stage a cascade prune. With the record in hand,
an option widget's existing cascade clear runs on this surface as it does on the
form: a stored value the record's CURRENT parent no longer offers is dropped
into the edit session's draft as soon as inline edit is entered, before the user
touches that field. A single `select` or `radio` then shows empty; a multi
`select` or `checkboxes` field keeps only its still-offered values. The next
record-level Save writes that pruned value together with the user's own edits;
Cancel discards it.

`InlineFieldInputProps` gains the optional `dependentValues` member, spelled and
shaped like the widgets' own prop (`Record<string, unknown>`). A host that
renders `InlineFieldInput` directly and wants `dependsOn` fields to cascade
passes the record there; a host that omits it keeps today's gated behaviour.
