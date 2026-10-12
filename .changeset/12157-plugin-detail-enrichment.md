---
'@object-ui/plugin-detail': patch
---

The detail view's inline-edit field enrichment no longer copies `allow_create`, `lookup_columns` or `lookup_page_size` off the object schema. The lookup picker reads `allowCreate`, `lookupColumns` and `lookupPageSize` alone since objectui#12157, and those are still copied.
