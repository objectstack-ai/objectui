---
'@object-ui/core': patch
---

Two deprecation warnings pointed at `MIGRATION_GUIDE.md`, a file deleted from the
repository in `8c5d20455` (objectui#6342).

`Registry.register()`'s missing-namespace warning now points at the live docs page
that documents namespaced registration
(`/docs/guide/plugin-development#namespaced-registration`) instead of the deleted
guide. At this change, `ValidationEngine`'s function-based-condition warning drops
its `See:` line entirely: the deleted guide covered component namespaces and lazy
field registration and never documented conditions at all, so that pointer was
misdirected as well as dead, and the warning already carries the complete
before/after migration inline.

⚠️ **Dated note, 2026-09-25 — `ValidationEngine`, and with it the warning described
above, is removed from `@object-ui/core` by a later change; in a release that carries
both entries, only the `Registry.register()` warning ships — objectui#7659.**

Both are console messages shipped to application developers, so neither can use
the immutable `git show <sha>^:<path>` provenance form objectui#6275 used for a
docblock — a reader of the npm package has no repository to run it against.
