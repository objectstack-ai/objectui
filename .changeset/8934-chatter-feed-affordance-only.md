---
'@object-ui/plugin-detail': minor
---

`record:chatter.feed` / `record:discussion.feed` apply the filter members the
protocol declares on them (objectui#8934).

**Behaviour change on shipped pages.** Read the defaults section below before
upgrading.

**The gap.** `@objectstack/spec` declares `RecordChatterProps.feed:
RecordActivityProps.optional()` (`component.zod.ts:1366`), bound to both
`record:chatter` (`:2948`) and `record:discussion` (`:2962`). So `feed` is the
full `record:activity` shape, `types` / `limit` / `showCompleted` /
`unifiedTimeline` included. `RecordChatterRenderer` handed
`DiscussionContext.items` to the panel raw, and `applyFeedConfig` — the pipeline
those four members are applied by — had exactly one call site,
`renderers/record-activity.tsx`. An author who wrote a spec-legal
`feed: { types: ['comment'] }` therefore got no filtering, no diagnostic and no
way to tell.

**The fix.** `renderers/record-chatter.tsx` now runs `applyFeedConfig` before
handing items to `RecordChatterPanel`, with `record-activity.tsx:219`'s call
shape — not a second convention — and reads `limit` as the page window that
"Load more" grows by, the same way. The registration description is unchanged
in substance: it still says `feed` is the same shape as `record:activity`, and
now names the spec symbol it delegates to.

**Defaults come with the shape, and two of them are visible.** This applies to
an **authored `record:chatter` / `record:discussion` block**, and to every
synthesized default page (which emits `record:discussion`) — those are the
surfaces that render through `RecordChatterRenderer`. At this change the panel
the host auto-appends when a page omits a discussion block mounted
`RecordChatterPanel` directly and did **not** run this pipeline, so it was
unchanged and rendered a different feed from the authored block on the same
record; that divergence was filed as objectui#8983 and has since been closed —
the fallback now mounts this renderer with no schema, so both chatter surfaces
run the one pipeline and render the same feed. On the surfaces this change
reaches:

- `showCompleted` defaults to `false`, so **completed activities (feed type
  `task`) are no longer rendered** unless the block authors
  `feed: { showCompleted: true }`. A panel that was showing them will stop.
- an unauthored `limit` is `DEFAULT_ACTIVITY_LIMIT` (**20**), so a feed longer
  than twenty items now **pages**, with a "Load more" control, instead of
  rendering whole. Nothing is dropped — the window grows by `limit` per click.

`unifiedTimeline` and `types` change nothing unless authored: both are absent-is-
no-filter.

**Not closed by this change**, and not claimed to be: `filterMode` and
`enableMentions` are also members of the declared shape and are still unread on
this path — `RecordActivityTimeline` takes `filterMode` as a component prop
rather than off `config`, and the chatter path's mentions come from the host
context. Tracked as objectui#8968. The host fallback panel described above was
tracked as objectui#8983, since closed — see the note above it.

Marked `minor` rather than `patch`: this repository never declares `major` (the
fixed release group would drag every package off `@objectstack`'s cadence), and
its own breaking-semantics changes are `minor` with the breakage spelled out in
the notes — which is what the two bullets above are. The previous revision of
this changeset said `patch`, correctly for a description-only edit; that is not
what this is any more.
