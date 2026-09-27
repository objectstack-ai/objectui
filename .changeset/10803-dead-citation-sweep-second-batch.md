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
and `.js`; none of them moves a claim, and no code or type token changes — the
comment-stripped syntax tree of every touched file is identical before and after. No
published behaviour changes, so this declares no release.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
