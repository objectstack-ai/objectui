---
'@object-ui/types': minor
---

Retire `events`, `orientation` and `position` on the timeline node (objectui#6170, ADR-0049
stage 2 — maintainer ruling 2026-08-25: these three go the enforce-or-remove route; with no
producer expecting them to render, the route is remove).

**BREAKING for authored metadata.** No renderer ever read any of the three. A timeline authored
with `events` drew an empty rail, `orientation: 'horizontal'` drew the default vertical rail
(the layout key is `variant`), and `position` did nothing at all — every one of those documents
type-checked, parsed green, and failed in silence. They are now **refused**, loudly, at the
authoring boundary:

- `TimelineSchema.events`, `.orientation` and `.position` are declared `?: never` — writing any
  of them is a type error;
- the Zod twin in `@object-ui/types/zod` declares each as a retirement tombstone — parsing a
  document that carries one fails with `invalid_type` / `expected: never` on that key's path,
  and the message says what to write instead. The strict authoring face refuses them the same
  way (as the retired key, not as an unknown one).

**What to write instead:**

- `events` → `items`. Each entry is a timeline item `{ time?, title, description?, variant?,
  icon?, content?, className? }` (`title` required) — the date goes in `time`, not `date`, and a marker colour is
  `variant` (`default` / `success` / `warning` / `danger` / `info`), not `color`.
- `orientation` → `variant` (`'vertical'`, `'horizontal'` or `'gantt'`) — the same values for
  the two layouts it named.
- `position` → nothing. No key chooses the side of the vertical rail; it is always drawn on the
  left. Delete the key.

**What still type-checks and still parses:** a timeline that never wrote the three — absent
stays valid on both halves, and every declared key the renderer reads (`variant`, `items`,
`dateFormat`, `scale`, `rowLabel`, `minDate`, `maxDate`, `className`) is unchanged, as is the
undeclared `onItemClick` runtime slot that `ObjectTimeline` installs. The `TimelineEvent`
interface and its Zod mirror `TimelineEventSchema` stay exported, so an import of either still
compiles; nothing in `TimelineSchema` references them any more.

This completes the change the earlier objectui#6170 entry routed: that entry made `events`
optional and said the three "remain declared" — they are now retired. If the last
`@object-ui/types` you installed predates that entry, `events` was still *required* there, and
it goes straight from required to refused.

**Why tombstones rather than deleting the members.** `BaseSchema` is `.passthrough()` on the Zod
side and carries `[key: string]: any` on the TS side, so an *undeclared* key is accepted,
unvalidated, by both halves. Deleting the three would have let them type-check and parse green
while still rendering nothing — the silent no-op this retirement exists to make audible.

Also in this change: the in-repo example `packages/types/examples/data-display-examples.json`
(its `timeline` node authored all three) is migrated to `items` / `variant`; the two
`content/docs/api/schema-reference.md` snippets that authored `events: []` now author
`items: []`; and the plugin-timeline docs callout says retired rather than deprecated.

Version note: `minor`, not `major`, per AGENTS.md §版本号策略 — objectui's major tracks the
`@objectstack` major and all publishable packages share one `fixed` group, so a breaking
narrowing is declared `minor` with the break spelled out here.
