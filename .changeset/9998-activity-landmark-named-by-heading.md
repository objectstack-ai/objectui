---
'@object-ui/plugin-detail': patch
---

`record:activity`'s landmark is named after the heading it shows, not
"Discussion" (objectui#9998).

`RecordActivityTimeline` named its `<section>` landmark with a fixed
`aria-label` (`detail.discussion`), while the visible heading inside it read
`titleLabel ?? t('detail.activity')` followed by an `(N)` count. A
`record:activity` block passes no `titleLabel`, so the region's accessible name
was "Discussion" under a heading reading "Activity (N)". That breaks
the repo's own rule from objectui#4118: a speech-input user says what they see,
so the landmark's spoken name must be the heading. `record:chatter` passes
`titleLabel={t('detail.discussion')}`, so it happened to agree.

The section's `aria-label` now uses the same value as the heading's title. The
component reads that value once and uses it for both, so the name and the
visible words cannot drift apart:

- `record:activity`'s landmark is named "Activity", in the session locale;
- `record:chatter`'s landmark is still named "Discussion";
- an authored `titleLabel` now names both the heading and the landmark.

The `(N)` count stays in the visible heading and stays out of the landmark's
name. It is live status that changes with the filter, not part of the panel's
name.

The timeline's section has contained this heading since the section was
introduced. The objectui#4645 entry, which said it had no visible label, is
corrected to match.

No prop, export or locale key changed.
