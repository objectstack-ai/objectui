---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/core`,
`@object-ui/data-objectstack`, `@object-ui/plugin-calendar`, `@object-ui/plugin-gantt`,
`@object-ui/plugin-map`, `@object-ui/plugin-tree`, `@object-ui/react` and `@object-ui/types`:
docblocks and code comments that cited objectui issues which answer 404 now cite the commit
that landed each change, as a 9-character sha (objectui#10771). Some of these docblocks
reach the emitted `.d.ts` and `.js`; none of them moves a claim, and no code or type token
changes — the comment-stripped syntax tree of every touched file is identical before and
after. No published behaviour changes, so this declares no release. The one runtime
message the sweep touches, `assertObjectMetadataWritable`'s refusal in
`@object-ui/data-objectstack`, is declared on its own as a patch in
`10771-write-guard-message-citation.md`.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
