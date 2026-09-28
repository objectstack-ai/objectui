---
'@object-ui/plugin-timeline': patch
---

docs(plugin-timeline): the README's "Schema-Driven Usage" example is now a document the validator accepts

The example spelled its node `component: 'timeline'`. Every node in the protocol
is keyed by `type`, so `safeValidateSchema` — the call `objectui validate` makes —
refused the document exactly as a reader would copy it (`invalid_union` at
`type`), and rendering it painted the registry's "Unknown component type" panel
instead of a timeline. The README ships in this package's tarball, so the wrong
spelling was on the npm landing page (objectui#10824).

The node is now `type: 'timeline'`. The rest of the example already fits the item
element objectui#6356 declared — a feed item with `time`, `title`, `description`
and `variant` — so nothing else in it moves.

A new pin extracts that block from the README on every run and feeds it to
`safeValidateSchema` and to the strict authoring face, so the example cannot drift
from the schema again without a test going red. No source or behaviour change.
