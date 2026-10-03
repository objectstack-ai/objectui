---
'@object-ui/plugin-form': patch
---

The top-level `fields` input descriptions of `object-form`, `view:form`,
`embeddable-form` and `object-master-detail-form`, and the `console.warn` a
top-level `fields` member that resolves to no field name draws, no longer say
that a `{ name }` object member "is tolerated" (objectui#11550). Each still says
that the members are bare field names, and the warning still names the right
spelling: a bare field-name string, or an entry in `sections[].fields`.

Write top-level `fields` members as bare field-name strings, for example
`"fields": ["name", "email"]`. A per-field override (`colSpan`, a label) goes on
a `sections[].fields` entry instead.

Behaviour is unchanged. A `{ name }` member already stored in a form view still
reads at render, and the member that resolves to no name is still skipped with
the same warning; only the wording that taught `{ name }` as an authoring
spelling is gone.
