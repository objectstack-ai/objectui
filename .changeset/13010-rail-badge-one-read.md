---
'@object-ui/components': minor
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
---

A record page that shows the same unfiltered related list both as a `record:reference_rail` card and in a `page:tabs` count badge now reads that list once on open, not twice. The rail claims its rows in `RelatedCountStore` while it renders; the badge's probe then asks for the card's rows with its count, and the card takes them. If the rail reads first, the badge joins that read. A badge with its own declared filter still sends its own probe. A rail alone on the page still reads only when it comes into view, and a refresh still reads the rail again.

`RelatedCountStore`, exported from `@object-ui/components`, gains three members:

- `RelatedCountStore.claimRows(objectName, relationshipField, parentId, limit)` declares that a card will list the first `limit` rows of that unfiltered related list, so a count probe of the same list fetches those rows with its count; it reads nothing itself.
- `RelatedCountStore.fetchRows(finder, objectName, relationshipField, parentId, limit, fields?)` resolves to `{ total, rows }` for that list, taking rows a probe already holds for the claim (once only), joining a read in flight, or reading itself; it rejects when the read fails.
- `RelatedCountStore.releaseRows(objectName, relationshipField, parentId)` withdraws the claim when the card unmounts or moves to a new scope, dropping any rows still held for it; held rows are also dropped when the child object is invalidated.
