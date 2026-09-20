---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

Bind the host discussion fallback to the same feed pipeline the authored
`record:discussion` / `record:chatter` block runs (objectui#8983).

**User-visible.** A record page whose AUTHORED page schema omits a discussion
block gets the host's bottom auto-append. That fallback used to mount
`RecordChatterPanel` directly with raw rows, while the authored/synthesized
block renders through `RecordChatterRenderer`, which since objectui#8934 runs
`applyFeedConfig`. The two surfaces therefore rendered different feeds from the
same rows: a completed activity appeared on the fallback and not on the block
(the spec's `showCompleted` default is `false`), and a feed longer than the
default page window rendered whole on the fallback and paged on the block.

The fallback now mounts `RecordChatterRenderer` — the very component
`ComponentRegistry` resolves both block names to — with no authored schema, so
it reads the feed off the `DiscussionContext` the view already provides and runs
the one pipeline. Concretely, on a record whose feed carries a completed
activity, the auto-appended panel no longer lists it; on a record with more than
twenty feed rows, the auto-appended panel now shows the newest twenty with a
working "Load more" instead of the whole feed at once. Both are
`record:activity`'s declared behaviour, which is what `@objectstack/spec` says
the `feed` key is.

Deliberately a binding rather than a copy: the fallback was not taught its own
filter logic, so there is one implementation of the feed pipeline and not two
kept in agreement by hand.
