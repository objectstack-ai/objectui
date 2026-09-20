---
'@object-ui/i18n': minor
'@object-ui/app-shell': minor
'@object-ui/console': minor
---

Load locale catalogues on demand — the ten packs leave the eager closure (objectui#7479)

`@object-ui/i18n`'s entry re-exported all ten catalogues and `builtInLocales`
named every one of them in a single object literal, so every import of the
package made all ten statically reachable and nothing could tree-shake them.
The console fetched **456,196 gzipped bytes** of translation data before first
paint, for a viewer who reads one catalogue — and every new translation key was
paid for by every visitor in every language.

**What changed at the contract.** `en` stays statically re-exported from the
entry; the other nine are fetched per locale through the new
`loadBuiltInLocale()`. `en` is not an exemption, it is what makes the split
safe: it is `fallbackLng`, it is the source of the `TranslationKeys` type, and
it is the synchronous dictionary `@object-ui/app-shell`'s splash renders from
before i18n is usable and on the server-down path. Removing it would have meant
raw keys on screen in nine languages, or English literals in the splash — the
"delete or untranslate the copy" route this work was explicitly not allowed to
take.

New on the entry, all of them payload-free:

- `loadBuiltInLocale(code)` — fetch one catalogue; `null` for a code this
  package does not ship. Memoised, and a failed fetch stays retryable.
- `getLoadedBuiltInLocales()` / `isBuiltInLocaleLoaded(code)` — what is resident
  right now, synchronously.
- `BUILT_IN_LANGUAGE_CODES` / `isBuiltInLanguage(code)` — enumerate all ten
  without fetching any of them.
- `preloadBootstrapLocale(options)` / `resolveBootstrapLanguage(options)` —
  resolve the boot language and fetch its catalogue BEFORE the first render.
- `pickInitialLanguage(config)` — the language `createI18n` will boot in.

`I18nProvider` fetches the catalogue for whatever language it boots into, and
`changeLanguage()` awaits the new catalogue before switching, so a switcher
needs no new wiring.

**BREAKING for an importer of a specific pack.** `zh`, `ja`, `ko`, `de`, `fr`,
`es`, `pt`, `ru`, `ar` and `builtInLocales` are no longer exported from
`@object-ui/i18n`. They are exported from the new `@object-ui/i18n/locales`
subpath, which is the explicit all-ten door — a specifier whose cost is visible
at the import site. ⚠️ Never reach for it on a page-load path. (Marked `minor`
rather than `major` per this repository's version-alignment rule; the breaking
semantics are stated here.)

**What a page load costs now.** Two full console builds in one container, same
instrument, `origin/main` `d8b4739d4` against this change:

| reading                     |   control |     after |    delta |
|-----------------------------|----------:|----------:|---------:|
| eager closure, gzipped      | 3,575,370 | 3,164,817 | −410,553 |
| eager chunks / total        |    50/518 |    51/528 |          |
| catalogues in that closure  |        10 |         1 |       −9 |
| `vendor-objectstack`        | 1,236,315 | 1,236,315 |        0 |
| `ui-components`             |   394,726 |   394,718 |       −8 |
| `framework`                 |    80,414 |    80,430 |      +16 |

The last three rows are the control that makes the first one readable: the bytes
did not move to a roomier chunk, they left the eager closure. The nine deferred
catalogues weigh 405.5 KB gzipped and the browser fetches exactly one of them,
only when the viewer's locale is not `en`.

**Gates.** `PER_CHUNK_GZIP_CEILINGS['i18n-locales']` (465,000 over ten
catalogues) is replaced by `['i18n-locale-en']` at 50,000 over 40,415, and
`MAX_EAGER_CLOSURE_GZIP_BYTES` comes down from 3,597,000 to 3,210,000 — both
LOWERINGS that follow the measured drop, and the aggregate one is required: left
where it was, its headroom would have been 4.74x the regression this gate must
catch and the sensitivity half would have called the gauge blind. The
`i18n-locales` entry in `EXHAUSTED_HEADROOM_ALLOWANCES` is removed rather than
lowered — its chunk no longer exists, and the catalogue that remains clears the
floor on its own.

A new gate, `pnpm check:eager-locale-catalogues`, weighs COMPOSITION rather than
bytes: exactly one catalogue may be in the built eager closure, and it must be
the resident one. A byte ceiling cannot catch the catalogues returning one at a
time inside its headroom, and cannot tell "left the closure" from "moved to a
chunk with more room".
