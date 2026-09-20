---
'@object-ui/i18n': patch
---

The README states **ten** built-in locales, derived from the package rather than restated
(objectui#7989).

`README.md` ships in this package's `files`, so the two lines a reader meets first went out
in every tarball claiming **11** built-in locales. The package has ten —
`BUILT_IN_LANGUAGE_CODES` and the `@object-ui/i18n/locales` map agree on
`en zh ja ko de fr es pt ru ar` — and the same document already reasoned on ten six times
further down ("the other nine are separate chunks", "all ten codes", "of the ten packs").
The "and more" hedge goes with the number: that bullet enumerates all ten languages, so
there is no more.

The correction is the smaller half. A **restated** number is the construct that permitted
the error, and correcting one in isolation has already failed to stop the next instance —
objectui#3351 fixed the same off-by-one in a changeset file and nobody swept the README.
So the count is now read off the document and compared against what the package exports,
on two doors that must agree: the payload-free `BUILT_IN_LANGUAGE_CODES` a consumer of the
entry gets, and the `builtInLocales` map behind the published `./locales` subpath.

⛔ No runtime behaviour changes, and the two sites that were already correct —
`src/index.ts`'s `@packageDocumentation` and this manifest's `description` — are untouched.
