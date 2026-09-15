---
---

Test-only change (objectui#8071, sixth declared slice). Registers per-block
member pins for the five `record:*` detail-panel blocks that each carried
exactly ONE unpinned array/object key — `record:activity.types`,
`record:alert.action`, `record:chatter.feed`, `record:discussion.feed` and
`record:path.stages` — deletes their five `MEMBER_PIN_EXEMPTIONS` entries and
lowers `MEMBER_PIN_EXEMPTION_CEILING` 46 -> 41 in the same commit. All five
blocks now carry zero exemptions; this is the first slice to close more than one
block.

`record:chatter.feed` and `record:discussion.feed` are one key on one renderer
(`RecordChatterRenderer` is registered under both names against the same
`CHATTER_INPUTS`), so both rows point at a single file that runs every case
against both names. `record:activity.types` PROMOTES the pre-existing
`recordActivityFeed.test.ts`, read end to end before being credited; the other
three files are new.

Every touched file is a `__tests__` file; no published runtime source, no
`package.json` publish-contract field, no behaviour change.
