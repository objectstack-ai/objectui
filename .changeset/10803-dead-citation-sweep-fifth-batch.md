---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/core`,
`@object-ui/fields`, `@object-ui/plugin-charts`, `@object-ui/plugin-chatbot`,
`@object-ui/plugin-dashboard`, `@object-ui/plugin-designer`, `@object-ui/plugin-detail`,
`@object-ui/plugin-grid`, `@object-ui/plugin-list`, `@object-ui/plugin-markdown`,
`@object-ui/plugin-timeline`, `@object-ui/react` and `@object-ui/types` (whose runtime text is
declared separately below), plus the private
`@object-ui/test-support`: docblocks and code comments that cited objectui issues or pull
requests which answer 404 now cite the commit that landed each change, as a 9-character
sha, the ruling by its date where the sentence cites a ruling, or a live pointer the
sentence already named, and where nothing answers they name the card by role
(objectui#10803, the fifth batch). Bare numbers that were sister-repo cards are now written
`objectstack#3720`, `objectstack#5506` and `objectstack#6936`. Some of these docblocks
reach the emitted `.d.ts` and `.js`; none of them moves a claim, and none of these comment
edits changes a code or type token. No published behaviour changes through them, so this
declares no release. The runtime text the sweep touches, six tombstone guidance strings,
one refusal message and one zod `.describe()` string in `@object-ui/types`, is declared on
its own as a patch in `10803-fifth-batch-runtime-strings.md`.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
