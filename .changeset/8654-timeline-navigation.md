---
'@object-ui/plugin-timeline': minor
---

`navigation` is declared on the `object-timeline` block, by reference to `@objectstack/spec` (objectui#8654). This is the timeline arm of the objectui#8652 maintainer ruling: the spec declares the key on the `object-timeline` element from 17.5.0, for the block standalone, and objectui now mirrors it.

- `ObjectTimelineProps['schema']` declares `navigation` with the spec's `NavigationConfig` type (`ViewNavigationConfig`), the type the grid, kanban and calendar schemas use. `ObjectTimeline` reads the key without a cast. `TimelineSchema` in `@object-ui/types` is unchanged: it describes the presentational rail, which does not read the key.
- The `object-timeline` and `view:timeline` registrations publish `navigation` in their `inputs`, so the designer offers it.
- An authored `{ "type": "object-timeline", "properties": { … } }` document was already judged by the spec row: a bad `mode` is refused at `properties.navigation.mode`, and a member the spec does not declare inside the block is refused. That is unchanged and now pinned.

What a click does with each member is unchanged. `drawer`, `modal` and `popover` open the entry's record in that overlay, and `new_window` or `openNewTab: true` opens the record page in a new tab. Three things open nothing on a timeline that no parent view navigates for: an absent key, `page` (also what a block without `mode` resolves to), and `split`. The published input description says so.
