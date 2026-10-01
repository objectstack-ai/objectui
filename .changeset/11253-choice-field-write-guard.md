---
'@object-ui/data-objectstack': minor
---

The object-metadata write guard now holds a `select` / `radio` field that has no option source.

This is the objectui half of the maintainer's ruling A on objectstack#20827, which refuses a
`select` / `radio` with neither `options` nor `picklist` at the `FieldSchema` door and has objectui
stop sending one first. The rule lives in the existing door guard, so `MetadataClient.save`,
`importObjectDraft` and `MetadataService` all apply it, for every writer behind them.

BREAKING (behaviour, released as `minor` per this repository's version policy):
`assertObjectMetadataWritable('object', …)`, and so `MetadataClient.save('object', …)`, now throws
BEFORE issuing the request when a `select` or `radio` field carries neither a non-empty `options`
list nor a `picklist` string. `options: []` counts as none, as the contract's own completeness rule
reads it. Unlike the relationship rule, this refuses a document the installed server still accepts:
the ruling orders the client first on purpose, and the door follows. The message names the field
and asks for an option, a shared `picklist`, or a non-choice type. A field that names a `picklist`
is never refused by this rule.

The Studio data page and the metadata-admin object editor already surface the refusal in their
error banner and send the next autosave once an option exists, including for an object that already
stores such a field.

New export: `CHOICE_TYPES_REQUIRING_OPTIONS`, derived by this package's pin from the installed
`@objectstack/spec`'s `field/choice-without-options` completeness rule.
