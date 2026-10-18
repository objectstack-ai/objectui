---
'@object-ui/react': minor
---

New export `isRecordPageOf(page, objectName)` (objectui#12715): true when `page` is a record page bound to `objectName` (`type: 'record'` and `object` names it). It is the one reading of "a record page of object O": `usePageAssignment`'s object-based lookup now filters its candidates with it, unchanged in behaviour, and the console's named record page route asks it before it renders a named page for a record.

`usePageAssignment`'s `pageName` option is unchanged: it still returns the page with that name whatever its type or object, so a caller that renders a record on the page it gets back asks `isRecordPageOf` first.
