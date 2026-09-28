---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/core`,
`@object-ui/data-objectstack`, `@object-ui/i18n`, `@object-ui/permissions`,
`@object-ui/plugin-calendar`, `@object-ui/plugin-designer`, `@object-ui/plugin-detail`,
`@object-ui/plugin-form`, `@object-ui/plugin-grid`, `@object-ui/plugin-kanban`,
`@object-ui/plugin-list`, `@object-ui/plugin-tree`, `@object-ui/providers`,
`@object-ui/react` and `@object-ui/types` (two console warnings in `@object-ui/app-shell`
and `@object-ui/plugin-detail` are runtime text, declared separately below): docblocks and
code comments that cited an `objectstack` issue or pull request which answers 404 now cite
the commit in that repository that landed the change, written as objectstack and a
9-character sha (objectui#10803, the seventh batch). Where the sentence already names that
change's live pull request or commit, or dates the ruling it points at, the dead number is
dropped instead, and one sentence cites this repository's own landing commit, because the
fix it names landed here. Comments that named the apiMethods whitelist card as a bare
number now read `objectstack#3391`, and the two that paired it with a second bare number
read `objectstack#3546` for it: a bare number resolves to this repository, where both
numbers are unrelated cards. None of these comment edits moves a claim or changes a code or
type token. No published behaviour changes through them, so this declares no release.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
