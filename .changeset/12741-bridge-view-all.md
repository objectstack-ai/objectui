---
'@object-ui/app-shell': minor
---

On a record page, a related list's "View all" opens the child object's list (objectui#12741). The destination is the ADR-0055 bare data surface, `/apps/APP/OBJECT/data?filter[FIELD]=PARENT`, which is the route a dashboard drill's "Open in list" already uses. It is not anchored to a saved view, so it shows every record related to this parent.

`RelatedRecordActionsBridge` offers the link only where that route can say "this parent's children". It withholds it for a list with no relationship or no parent value, and for a `multiple: true` relationship field, because the route's URL filter has no membership operator. It also withholds it for a relationship field the viewer cannot read, because the list page drops that condition and would open the whole table.

Clause-② line, the same as the pull request's:
Clause-②: yes
No export of this package changes: `recordListPath` lives beside `useOpenRecordList` and is not exported from the package entry. The Clause-② change is `@object-ui/react`'s new `RelatedRecordHandlers.onViewAll`, which this bridge supplies.
