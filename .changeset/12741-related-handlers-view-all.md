---
'@object-ui/react': minor
---

`RelatedRecordHandlers` gains an optional `onViewAll` (objectui#12741). A host returns it from `resolve` to open the child object's full list page, scoped to the parent on the relationship it was handed. `record:related_list` calls it from its "View all" link. A host that omits it draws no link, as for every other handler on this interface.

Clause-② line, the same as the pull request's:
Clause-②: yes
One optional member is added to the exported `RelatedRecordHandlers` interface. Nothing else on the package entry changes.
