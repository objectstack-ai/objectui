---
'@object-ui/fields': patch
'@object-ui/i18n': patch
---

A lookup / master-detail / tree value whose referenced record the viewer's own read answers "not found" for (a 404, which is what the server answers for a record this viewer may not read) now reads "Restricted record", translated, with a lock icon, no record id and no link, in grids and on the record page (objectui#13335). It used to print the raw id beside a question mark. No additional read is made: the label comes from the same lookup read the cell already performed, so it reveals nothing the id did not. A reference that is still loading, whose read failed, or that is empty renders as before, and a readable reference still shows its name as a link. New key: `detail.restrictedLookupReference` in all ten locale packs.
