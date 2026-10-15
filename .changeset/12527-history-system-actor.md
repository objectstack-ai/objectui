---
'@object-ui/plugin-detail': patch
---

Record page History: an entry with no actor at all (neither a resolved name nor a user id — a seed backfill or a hook with no user in context) now reads "System" with a cog glyph instead of "Unknown user" with a "?" avatar. The label is the existing `detail.systemActor` key that `record:activity` already uses, so it is translated in all ten locale packs. "Unknown user" (and the `unknownUserText` override) stays for the one case that is unknown: a user id that resolved to no name. The `record:history` self-fetch now carries each row's actor id through to the timeline so it can tell the two apart.
