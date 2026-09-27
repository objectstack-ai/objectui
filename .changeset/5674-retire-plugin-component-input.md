---
'@object-ui/types': minor
---

Retire the published alias `PluginComponentInput` — use `ComponentInput` (objectui#5674).

Stage 2 of 2 of a maintainer-ruled retirement (2026-08-22, item 13 = A: deprecate for a
release, then delete). Stage 1 marked `ComponentInput as PluginComponentInput`
`@deprecated`, pointing at `ComponentInput`, without removing it. That code merged and
reached users in the published `17.6.0` tarball, but no CHANGELOG entry records it: its
own changeset (`plugin-component-input-deprecate-5674.md`) is still pending and releases
alongside this one, not as a prior release of its own. This change removes the alias:
`@object-ui/types`' entry point no longer exports `PluginComponentInput` at all.

**Why now, and why a `minor` rather than waiting further.** The deprecation window exists
to warn a consumer outside this repository, unmeasurable from here, before a published
export disappears. That window has already been spent — stage 1 shipped and the warning
has been live. The follow-up card that was meant to gate stage 2 on "a release actually
shipping the deprecation" was later closed as a duplicate into a release-batch tracking
card that itself no longer exists (answers 404), so the gate had no carrier left to clear.
Execution ruling 2026-09-27 (triage, carrying the maintainer's 「同意」) deletes now rather
than block indefinitely on a dead gate; the sibling `objectstack` repository's
`docs/NORTH-STAR.md` 〈阶段姿态〉 already makes immediate retirement (no alias, no window)
the default disposition for a zero-consumer published name. Removing a published export
is `minor`, not `patch` — this repo's own
breaking changes never declare `major` (see `AGENTS.md`'s version-alignment policy).

**Migration.** Replace `PluginComponentInput` with `ComponentInput` — they have named the
identical declaration since objectui#4972 converged the plugin-scoped interface onto
`base.ts`, so this is a rename with no shape change:

```diff
-import type { PluginComponentInput } from '@object-ui/types';
+import type { ComponentInput } from '@object-ui/types';
```

**Consumers, re-measured on this branch.** Re-counted against `origin/main` before this
change (excluding `dist/` and `node_modules/`): zero importers, in this repository or its
sibling `objectstack` checkout. The only occurrences were the alias specifier itself, its
now-superseded stage-1 pin, and prose in docblocks and changesets (including this one's
own predecessor). No importer appeared, so the recount did not block the deletion.

**What else moved with it.** `plugin-scope.ts` carried `export type { ComponentInput }
from './base.js'` for the sole purpose of feeding this alias — its own docblock said so
and called for its removal alongside the alias — so that now-dead re-export is deleted in
the same change. The stage-1 pin test
(`packages/types/src/__tests__/plugin-component-input-deprecation.test.ts`) is flipped in
place into a stage-2 pin: it now asserts the published entry no longer exports the name
(a source-text check) and that importing it is a compile error (a `@ts-expect-error`
type-level check, enforced by this package's `type-check` script), plus a control that the
still-`@deprecated` (not yet retired) `PluginComponentMeta` neighbour in the same export
block is untouched.
