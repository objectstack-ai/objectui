---
'@object-ui/i18n': patch
---

fix(i18n): a translation bundle with no field label is recognised as a spec payload (objectui#10235)

The console's `loadLanguage` asks `isSpecTranslationData` whether the payload it fetched is a
`@objectstack/spec` `TranslationData`. On `true` it transforms the payload and namespaces it under
`app`, where `useObjectLabel` and the screen-flow runner read it; on `false` it returns the payload
untouched, for a mock or local-dev server that already speaks i18next namespaces. The predicate
answered `true` only when some `objects` entry carried `fields`, so a genuine bundle that translated
object labels, apps, pages, dashboards or flows — and no field label — took the untouched branch, sat
at the root of the i18next resource tree, and was read by nothing: every screen drew the authored
copy in every locale, with nothing reported.

`isSpecTranslationData` now answers `true` for a payload carrying any top-level group of the served
translation document — `objects`, `apps`, `messages`, `globalActions`, `dashboards`, `datasets`,
`pages`, `flows`, `settings`, `metadataForms` or `settingsCommon` — whose value is an object. The
console's own tests walk that group list off `@objectstack/spec`'s `GetTranslationsResponseSchema`,
so a group the spec adds and the predicate does not know fails a test instead of being dropped.

An already-namespaced i18next tree still takes the untouched branch: its top-level keys are namespace
names (`common`, an app namespace such as `crm`, or the `app` the transform itself emits), none of
which is a spec group, and no built-in locale pack namespace is spelled like one. A group-named key
holding a string or an array is not treated as a group.

What a user sees change: in the console, an app whose translation bundle carries no field label now
shows its translated object names, app and navigation labels, dashboard and page titles, and
screen-flow wizard copy, where it used to show the authored copy.
