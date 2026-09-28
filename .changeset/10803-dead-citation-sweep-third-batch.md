---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/core`,
`@object-ui/data-objectstack`, `@object-ui/i18n`, `@object-ui/layout`,
`@object-ui/plugin-charts`, `@object-ui/plugin-dashboard`, `@object-ui/plugin-detail`,
`@object-ui/react`, `@object-ui/sdui-parser` and `@object-ui/types`: docblocks and code
comments that cited objectui issues which answer 404 now cite the commit that landed each
change, as a 9-character sha, the ruling by its date where the sentence cites a ruling, or
a live successor, and where nothing answers they name the card by role (objectui#10803,
the third batch). Some of these docblocks reach the
emitted `.d.ts` and `.js`; none of them moves a claim, and none of these comment edits
changes a code or type token. No published behaviour changes through them, so this
declares no release. The runtime text the sweep touches, four tombstone guidance strings
and two zod `.describe()` strings in `@object-ui/types` and one CEL authoring advisory in
`@object-ui/app-shell`, is declared on its own as a patch in
`10803-third-batch-runtime-strings.md`.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
