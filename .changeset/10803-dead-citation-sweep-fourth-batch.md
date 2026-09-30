---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/cli`, `@object-ui/components`,
`@object-ui/core`, `@object-ui/data-objectstack`, `@object-ui/fields`, `@object-ui/i18n`,
`@object-ui/plugin-chatbot`, `@object-ui/plugin-grid`, `@object-ui/plugin-kanban`,
`@object-ui/plugin-timeline` and `@object-ui/types`, plus the private
`@object-ui/test-support`: docblocks and code comments that cited objectui issues which
answer 404 now cite the commit that landed each change, as a 9-character sha, the ruling
by its date where the sentence cites a ruling, or a live pointer the sentence already
named, and where nothing answers they name the card by role (objectui#10803, the fourth
batch). One bare number that was a sister-repo pull request is now written
`objectstack#6942`. Some of these docblocks reach the emitted `.d.ts` and `.js`; none of
them moves a claim, and none of these comment edits changes a code or type token. No
published behaviour changes through them, so this declares no release. The runtime text
the sweep touches, two tombstone guidance strings and two zod `.describe()` strings in
`@object-ui/types`, is declared on its own as a patch in
`10803-fourth-batch-runtime-strings.md`.

The same repair in the pending changesets that carried these citations is prose-only, and
their frontmatter is byte-identical.
