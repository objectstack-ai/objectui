---
'@object-ui/fields': patch
---

`file-size-guard`'s docblock no longer restates a built-in locale count, and points at the
test that re-derives it (objectui#9615).

The shared `fields.file.exceedsMaxSize` docblock asserted that the key was "already
translated in all 11 built-in locales". `@object-ui/i18n` ships ten —
`BUILT_IN_LANGUAGE_CODES` and the `@object-ui/i18n/locales` map agree on
`en zh ja ko de fr es pt ru ar`, and `readme-locale-count-7989.test.ts` asserts that
agreement. This is not an internal note: the docblock is emitted into
`dist/widgets/file-size-guard.d.ts`, which is in this package's `files`, so the false count
went out in every tarball and is what a consumer's editor shows on hover.

Correcting the numeral to ten was weighed and refused. A restated count is the construct
that permitted the error, and this repository has now watched it recur three times over the
same fact — objectui#3351 in a changeset file, objectui#7989 in `packages/i18n/README.md`,
and this one in published source. So the number is **gone** rather than corrected: the
sentence now claims only what it needs (the key is translated in every locale the package
ships) and names `all-locales-key-parity.test.ts` as the instrument that re-derives it.
That test asserts the stronger invariant — every pack defines every `en` key — over
whatever the pack set is on the day it runs, so an eleventh pack makes the sentence more
true rather than false, and there is no figure left to rot (AGENTS.md commandment #9).
