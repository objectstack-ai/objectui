---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/core`,
`@object-ui/fields`, `@object-ui/plugin-calendar`, `@object-ui/plugin-chatbot`,
`@object-ui/plugin-dashboard`, `@object-ui/plugin-gantt`, `@object-ui/plugin-grid`,
`@object-ui/plugin-list`, `@object-ui/plugin-map`, `@object-ui/plugin-timeline`,
`@object-ui/plugin-tree`, `@object-ui/plugin-view`, `@object-ui/react`,
`@object-ui/sdui-parser` and `@object-ui/types`: docblocks and code comments that cited
objectui issues which answer 404 now cite the commit that landed each change, as a
9-character sha, or the ruling by its date where no single commit answers (objectui#10803,
the second batch after objectui#10771). Some of these docblocks reach the emitted `.d.ts`
and `.js`; none of them moves a claim, and none of these comment edits changes a code or
type token. No published behaviour changes through them, so this declares no release.
The one runtime text the sweep touches, eleven zod `.describe()` strings in
`@object-ui/types`, is declared on its own as a patch in
`10803-describe-string-citations.md`.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
