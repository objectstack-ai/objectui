---
'@object-ui/fields': minor
'@object-ui/i18n': minor
---

`RecipientPickerField` gains a picker mode for the `field` sharing recipient
(objectui#7613; maintainer ruling objectstack#14103, executor objectstack#15072).

`sys_sharing_rule.recipient_type` carries a sixth value, `field` — the
record-relative recipient. The recipients are whoever a user-valued column of the
SHARED object names on each matched record, so `recipient_id` stores a field
NAME (`assignees`, `owner_manager`) and not a record id. The widget's
`TYPE_TO_OBJECT` table had no entry for that kind, so it fell through to the
plain text input documented for unknown types: functional (the stored value was
already the right one), but the admin had to know and type the machine name of
the column by hand, with no list to choose from and nothing saying whether the
name existed.

When `recipient_type` is `field`, the widget now reads the shared object from
the sibling `object_name` field — the same dependency the `filter-condition`
widget already reads — loads that object's schema through
`dataSource.getObjectSchema`, and offers its **user-valued** columns, storing the
column's name.

**The offered set is exactly the set the evaluator honours**, and that agreement
is the point of the change rather than a detail of it. The sharing evaluator
reads a column as users when it is the `user` type, or a `lookup` /
`master_detail` whose `reference` is `sys_user`; anything else it treats as
"grants nobody" and warns about once per rule. A picker offering a wider set
would let an admin save a rule that looks configured and authorises nobody —
worse than a hand-typed name, because it has a credible appearance. `hidden` is
deliberately not filtered (the evaluator honours a hidden user column), and
`reference_to` is deliberately not read (the protocol refuses that spelling by
name, and so does the evaluator).

Three things the mode says out loud rather than leaving to be inferred: it asks
for the shared object before offering anything when `object_name` is still
unset; an object with no user columns says so instead of rendering a
search-flavoured "No matches"; and a stored name that is not on the offered list
— a column deleted or retyped since the rule was saved — stays visible and is
marked, because the evaluator grants nobody for it and a control that merely
looked empty would hide a rule that still names it.

Unknown recipient types keep degrading to the plain text input, and so does
`field` itself when the data source cannot enumerate an object's columns: a
hand-typed name is worse than a list, and better than a list that can never
fill.

Three copy keys are added across all ten locale packs
(`fields.recipient.selectField`, `noUserFields`, `fieldNotUserTyped`). The
"select an object first" gate deliberately reuses the criteria builder's
existing sentence rather than adding a twin: it is the same sentence in the same
role on the same form, gating on the same sibling field.
