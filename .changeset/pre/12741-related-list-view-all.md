---
'@object-ui/plugin-detail': minor
---

`record:related_list` now draws the "View all" link its `showViewAll` key declares (objectui#12741, ENFORCE, the objectui half of objectstack-ai/objectstack#23941).

The contract declares `showViewAll: z.boolean().default(true)`, "Show 'View All' link to see all related records". Nothing read the key, and no host passed `RelatedList` an `onViewAll`, so the default drew nothing. The renderer reads the key now:

- **Absent or `true`**: the link draws when the host offers a destination (the new `RelatedRecordHandlers.onViewAll`) and the list has records. Clicking it opens the related object's records, filtered to this parent on the relationship the list already uses.
- **`false`**: no link.
- **An empty list, or no destination from the host**: no link.

`RelatedList` used to draw its "View all" link only when the records ran past one page. It now draws whenever it is handed `onViewAll` and has records, because the spec states no truncation condition. This renderer is the only caller that passes `onViewAll`.

⚠️ Behaviour change: on a console record page, every related list with records now shows "View all", unless it declares `showViewAll: false`.

Clause-② line, the same as the pull request's:
Clause-②: yes
`@object-ui/react`'s exported `RelatedRecordHandlers` gains one optional member, `onViewAll`. No input, key or accept set of this package changes.
