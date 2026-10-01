---
'@object-ui/plugin-designer': minor
---

The Field Designer's drawer no longer offers `select` as a field type for a new field, or as a type
to change an existing non-choice field into.

The drawer has no options editor, and `MetadataFieldsPage` saves every change at once, so a
picklist created there could only be a choice with nothing to choose, which the object write guard
now holds client-side (objectui#11253, the objectui half of the ruling on objectstack#20827). The
type returns once the drawer can author options.

BREAKING (behaviour, released as `minor` per this repository's version policy): a host that relied
on the drawer to create picklists loses that path until the drawer gains an options editor. An
existing `select` field keeps its own type in the drawer, so editing it shows and writes back what it
is, options included. The list's type filter still offers every type.
