---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/core`,
`@object-ui/data-objectstack`, `@object-ui/fields`, `@object-ui/layout`,
`@object-ui/plugin-dashboard`, `@object-ui/plugin-designer`, `@object-ui/plugin-detail`,
`@object-ui/plugin-form`, `@object-ui/plugin-grid`, `@object-ui/plugin-kanban`,
`@object-ui/plugin-list`, `@object-ui/plugin-view` and `@object-ui/types` (whose runtime
text is declared separately below): docblocks and code comments that cited objectui issues
which answer 404 now cite the commit that landed each change, as a 9-character sha, and
where nothing answers they name the card by role (objectui#10803, the sixth batch). Bare
numbers that were sister-repo cards or pull requests are now written `objectstack#N`, and
where the sister-repo pull request itself answers 404 the sentence cites its commit in
that repository instead. Two `@object-ui/plugin-grid` sites beside `objectstack#3720` that
named the apiMethods whitelist card bare now read `objectstack#3391`, the card they meant.
Some of these docblocks reach the
emitted `.d.ts` and `.js`; none of them moves a claim, and none of these comment edits
changes a code or type token. No published behaviour changes through them, so this
declares no release. The one runtime string the sweep touches, a zod `.describe()` string
in `@object-ui/types`, is declared on its own as a patch in
`10803-sixth-batch-runtime-strings.md`.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
