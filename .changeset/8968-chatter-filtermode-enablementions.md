---
'@object-ui/plugin-detail': minor
---

`record:chatter` / `record:discussion` now read `feed.filterMode` and
`feed.enableMentions` (objectui#8968).

`@objectstack/spec` declares `RecordChatterProps.feed` as `RecordActivityProps`,
bound to both block names, so every member of the activity shape is authorable
inside `feed`. objectui#8934 made the four filter members live by running
`applyFeedConfig` on this path; two members sit outside that pipeline and stayed
unread. Both are wired now, with `record:activity`'s own reading rather than a
second local one:

- **`feed.filterMode`** seeds which slice the panel opens on, normalized through
  the same function `record:activity` uses (an unrecognised value opens on `all`
  rather than on a filter nothing matches). It seeds component STATE, so the
  dropdown stays usable instead of being frozen on the authored value.
- **`feed.enableMentions`** gates the composer's @-autocomplete. `false`
  withholds the host discussion context's suggestion list, which is the
  behaviour the `record:activity` registration publishes for this key. The
  protocol's default is on, so an unauthored member keeps the affordance.

**Behaviour change for existing schemas.** An authored `feed.filterMode` other
than `all` now actually narrows the chatter feed, and an authored
`feed.enableMentions: false` now actually removes the @-autocomplete. Both were
accepted and discarded before. Schemas that authored neither key are unaffected.

`filterMode` and `showFilterToggle` are independent: with the dropdown gated off,
an authored `filterMode` becomes the author's fixed slice rather than becoming
inert. The reasoning is in the renderer's docblock and pinned by
`recordChatterFilterModeMentions-8968.test.tsx`.
