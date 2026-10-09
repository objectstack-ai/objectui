---
'@object-ui/plugin-detail': minor
'@object-ui/app-shell': minor
---

A field group's `visibleWhen` now gates its section on the record detail page, the same way it gates the section on the entry form (objectui#11630). Take an object whose `fieldGroups` entry declares `visibleWhen: "record.kind == 'pro'"`. The edit form hid the "Pro details" section on a `basic` row, but the detail page drew it on every row, header included. The detail page now draws it only where the predicate holds.

**How it works.** The detail body now writes each field group as `@objectstack/spec`'s own reference form, `{ group: KEY }` (`RecordDetailsProps.sections[].group`). `record:details` resolves the reference against the object's `fieldGroups`: the group's members, label, icon, description and collapse state, and its `visibleWhen`. The predicate is evaluated per record with the form's own evaluator (`resolveFieldRuleState` from `@object-ui/core`, under `usePredicateScope`), and both spellings work as they do on the form: a bare CEL string or a `{ dialect: 'cel', source }` envelope.

- Values bind under `record.`, so a bare identifier is unbound.
- A declared field the row does not carry compares as `null`.
- A relation binds as its stored id, even when the page's record arrived expanded.
- `previous` binds the persisted row, as on the record's edit form.
- A predicate that cannot be evaluated SHOWS the section and warns once, which is what the form does.

A FALSE verdict removes the whole section, heading and members. This is display only: the record API serves those fields either way.

**Clause-②: yes (output shape change).** BREAKING for code that reads the synthesized sections of a grouped object. The bump is still `minor`: under this repo's release model, objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.

- `buildDefaultPageSchema`, `buildDefaultTabs`, `buildDefaultDetails` and `resolveDetailSections` (`@object-ui/plugin-detail`) change the `record:details` `properties.sections[]` they emit for an object with `fieldGroups`:
  - Each declared group becomes `{ group: KEY, columns }`. It used to be an enumerated copy of the group: `name`, `label`, `icon`, `description`, `collapsible`, `defaultCollapsed`, `columns`, and `fields` as rich `{ name, label, type, … }` descriptors.
  - The trailing ungrouped section keeps `columns` and lists `fields` as bare names.
  - The node now parses as `RecordDetailsProps`; the old one was refused at every field object. Pages Studio seeds from it (`createSeed`) change the same way. An explicit `sections` option is still returned unchanged.
- `record:details` gates a `{ group }` reference with the group's `visibleWhen`. It does not read `visibleWhen` off an enumerated section, a key the spec refuses there.
- The console's default record page (`RecordDetailView`, `@object-ui/app-shell`) writes `{ group: KEY, showBorder: true }` for each declared group. Its ungrouped primary and "More details" sections are unchanged.
- The `record:details` registration's `sections` input description now says a `{ group }` reference inherits the group's `visibleWhen`, and that one written on a section itself is not read.
- Unchanged: `deriveFieldGroupDetailSections` still returns the resolved, enumerated sections (what a reference renders as), with no `visibleWhen` on them. No type member, zod member, registered `inputs` entry, prop or i18n key is added.

**Migration.**

- FROM reading a group's heading or members off a synthesized section (`sections[i].label`, `sections[i].fields`) → TO `deriveFieldGroupDetailSections(def)`, which returns the resolved sections, or the group's own entry in `def.fieldGroups`.
- FROM a stored page section copied from an older seed, `{ name: 'pro', label: 'Pro details', fields: [ … ] }` → TO `{ group: 'pro' }`, with `columns` / `showBorder` / `headerColor` kept if you set them. Only the reference form inherits the group's `visibleWhen`; an enumerated copy renders on every row, as before.
