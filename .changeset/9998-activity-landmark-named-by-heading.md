---
'@object-ui/plugin-detail': patch
---

`record:activity`'s landmark is named after the heading it shows, not
"Discussion" (objectui#9998).

`RecordActivityTimeline` named its `<section>` landmark with a fixed
`aria-label` (`detail.discussion`), while the visible heading inside it read
`titleLabel ?? t('detail.activity')` followed by an `(N)` count. A
`record:activity` block passes no `titleLabel`, so assistive tech announced a
region called "Discussion" under a heading reading "Activity (N)". That breaks
the repo's own rule from objectui#4118: a speech-input user says what they see,
so the landmark's spoken name must be the heading. `record:chatter` passes
`titleLabel={t('detail.discussion')}`, so it happened to agree.

The section now gets its name from the heading's title text through
`aria-labelledby`. The name and the visible words are the same DOM node, so
they cannot drift apart:

- `record:activity` is announced "Activity", in the session locale;
- `record:chatter` is still announced "Discussion";
- an authored `titleLabel` now names both the heading and the landmark.

The `(N)` count stays in the visible heading and stays out of the landmark's
name. It is live status that changes with the filter, not part of the panel's
name.

The objectui#4645 entry says both of its sections have no visible label. For
the timeline that was never true: its section has contained this heading since
the section was introduced. This entry corrects that claim.

No prop, export or locale key changed.
