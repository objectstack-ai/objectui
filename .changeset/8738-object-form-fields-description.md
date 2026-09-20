---
'@object-ui/plugin-form': patch
---

`object-form`'s top-level `fields` input now documents its member vocabulary
(objectui#8738, route 2 of 2 — route 1, a diagnostic `console.warn`, was a
separate ruling still pending when this was written; it landed 92 minutes
later, see the dated note below).

The registration declared `{ name: 'fields', type: 'array' }` with no
description, so an author had nowhere to read that this key's members are
**bare field names** — a different vocabulary from `sections[].fields`, which
also accepts the spec `FormFieldSchema` object (identity key `field`, e.g.
`{ field: 'note', colSpan: 2 }`). Moving one of those objects to the top-level
`fields` resolves to no name and is skipped by `SimpleObjectForm`
(`ObjectForm.tsx`) and by `buildFlatFields` (`flatFields.ts`, shared by the
drawer/modal presentations). Behaviour is unchanged by this entry; it only adds
the description text an author would need to avoid the drop before writing it.

⚠️ Dated correction, so the original reading is not taken for the behaviour of
the release this publishes into. As written — `fd9bf26df0`, 2026-09-09T14:28:48Z
— that drop was SILENT: no throw, no warning, no empty-state. That reading was
true for 92 minutes. `8fda009057` (objectui#8859, route 1 of the same card) put
a de-duplicated `console.warn` at both named read sites at 2026-09-09T16:00:31Z,
so the drop is no longer silent. What did NOT change: the member is still
skipped, and there is still no throw and no empty-state.
