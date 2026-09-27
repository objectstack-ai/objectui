---
'@object-ui/types': minor
'@object-ui/plugin-timeline': minor
---

feat(types)!: a timeline item is a declared feed item or gantt row, judged against the shape `variant` selects

`TimelineSchema.items` declared an object whose keys were all open, on both the
TypeScript type and the zod mirror. An item written `{ title, date }` therefore
type-checked and validated, and its `date` was dropped without a word — a feed
item's date is `time`. A gantt row on a vertical timeline, or a timeline item on
a gantt timeline, validated too and drew an empty entry with no diagnostic. And
the strict authoring schema refused every real timeline item, the schema
catalog's own included, because an item that declares no keys closes to nothing.

The item is now declared (objectui#6356, maintainer ruling Q1 = A, Q2 = C):

- **Timeline item** (`variant` `vertical`, the default, or `horizontal`) — new
  exported type `TimelineFeedItem`: `time`, `title`, `description`, `variant`,
  `icon`, `content`, `className`. `title` is **required**.
- **Gantt row** (`variant: 'gantt'`) — new exported types `TimelineGanttItem`
  (`label`, **required**, and optional `items`) and `TimelineGanttItemBar`
  (`title`, `startDate`, `endDate`, `variant`, all optional; a bar date is a
  string, a finite number or a `Date`).
- Item and bar `variant` is one of `default`, `success`, `warning`, `danger`,
  `info` — new exported type `TimelineItemVariant`.
- The zod faces gain `TimelineFeedItemSchema`, `TimelineGanttItemSchema` and
  `TimelineGanttItemBarSchema` on `@object-ui/types/zod`.

**Breaking, for authors (minor per this repository's version policy):**

- `TimelineSchema` validation now judges every item against the shape its
  `variant` selects. A gantt row on a vertical or horizontal timeline, or a
  timeline item on a gantt timeline, is refused, naming the missing `title` or
  `label` and each key that belongs to the other shape. A timeline item with no
  `title`, or a gantt row with no `label`, is refused.
- An item or bar `variant` outside the five is refused, and so is a bar date
  that is not a string, a finite number or a `Date`.
- In TypeScript, an item literal carrying a key neither shape declares (for
  example `date`, or `meta`) is an excess-property error. TypeScript cannot see
  the parent's `variant`, so a gantt row on a feed timeline still type-checks;
  validation is where that is refused.
- In TypeScript, an element of `TimelineSchema.items` is now the union
  `TimelineFeedItem | TimelineGanttItem`, where it was an object with `unknown`
  keys. Reading a key that only one shape declares needs the element narrowed
  first — for example `'label' in item`.
- `color`, `group`, `meta`, `startDate` and `endDate` on a timeline item are
  **not** authorable. `ObjectTimeline` composes them onto the items it maps from
  records and the renderer still draws them; they are typed inside
  `@object-ui/plugin-timeline` only, and the strict authoring schema refuses
  them by name.

This supersedes two statements elsewhere in these release notes: the
objectui#7164 and objectui#7365 entries say a row's and a bar's own keys stay
undeclared and open and that feed timelines are untouched. Their refusals still
hold, at the same paths — a non-object item at `items[i]`, a non-array row
`items` at `items[i].items`, a non-object bar at `items[i].items[j]` — and on
the tolerant `TimelineSchema` a bar still accepts keys it does not declare (the
strict authoring schema refuses them by name), but the keys above are now
declared, and feed timelines are judged too.

`TimelineSchema` stays a zod object: its `.shape`, its place in
`DataDisplaySchema` and the `timeScale` / `body` / `children` refusals are
unchanged. Deriving from it with `.extend()` over an existing key now throws in
zod 4 (the node carries a refinement); use `.safeExtend()`, which keeps it.

`@object-ui/plugin-timeline` (**breaking at compile time, shipped as a
`minor`**): `TimelineRenderer` is a public export, and its `schema` prop is now
typed as the renderer's own input — the two declared item shapes above, plus the
item keys `ObjectTimeline` composes (`color`, `group`, `meta`, `startDate`,
`endDate`, `_data`, and any string as a composed item's `variant`) — rather than
as the authored `TimelineSchema` of before, whose items accepted any key. So an
object literal passed to the prop whose item carries a key neither shape
declares is now an excess-property error (TS2353), exactly as it is against
`TimelineSchema`: `schema={{ type: 'timeline', items: [{ title: 'T', date: 'x' }] }}`
type-checked before and does not now. Fix it at the item — a feed item's date is
`time`. What still type-checks against the prop: any value typed
`TimelineSchema`, an `items` array that is not written as a fresh literal (for
example an array of string-keyed records held in a variable), items that are
empty objects, and the composed keys above.
