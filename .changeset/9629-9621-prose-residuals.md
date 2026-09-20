---
---

Internal only — no published package moves, so this declares no release
(objectui#9629). Three prose corrections to what objectui#9621 left behind, each
named as NON-BLOCKING by that PR's isolated at-tier contract review (VERDICT
PASS). ⛔ None of them is a contract defect, no published face moves in either
direction, and no assertion of either retirement pin was weakened.

1. **A docblock stopped writing an instrument's answer down.** The
   `ObjectKanbanSchema.allowCollapse` tombstone's docblock recorded per-key
   control counts as text. It now names the walk that derives them — the `it`
   called "`@object-ui/plugin-kanban` names it in ZERO files, with controls
   firing in the same pass", in
   `packages/types/src/__tests__/object-kanban-allow-collapse-retired-8801.test.ts`
   — and names the control keys without their counts, per commandment #9. The
   figures it carried had already drifted before they landed, which is the case
   that rule calls the dangerous one: a reader who spot-checks a still-plausible
   number confirms it and is still wrong.

2. **A suite title stopped contradicting its own contents.** In
   `packages/types/src/__tests__/bare-kanban-node-key-retired-8802.test.ts`,
   suite 3 was titled as though the sibling `object-kanban` arm kept every
   verdict it ever had, while carrying a row asserting that one of them had
   changed. The title now states the claim the suite actually measures: retiring
   the bare `kanban` arm moved no verdict on the sibling arm. The restating
   refusal row is gone rather than re-titled — it duplicated, in another card's
   file, a refusal that `object-kanban-allow-collapse-retired-8801.test.ts`
   already asserts together with its message, its `invalid_type` code and its
   own firing controls. A comment in its place records why it is absent, so it
   is not restored in either direction.

3. **A changeset enumeration stopped publishing short.** The objectui#8801
   release note listed where the retired name still occurs and omitted a comment
   in `packages/types/src/zod/complex.zod.ts`. Re-scanned with a
   whitespace-tolerant probe — a line-anchored grep cannot see prose that wraps
   mid-name — the paragraph now names each site rather than counting them, and
   carries the date it was taken, because that body publishes verbatim into the
   CHANGELOG at an unknown future date. Its frontmatter is untouched.
