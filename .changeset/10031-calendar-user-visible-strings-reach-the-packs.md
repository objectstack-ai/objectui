---
'@object-ui/plugin-calendar': patch
'@object-ui/i18n': patch
---

`ObjectCalendar`'s user-visible copy now reaches the locale packs. The component
was already i18n-aware — it imports and calls both translation hooks — and a set
of English sentences sat beside those calls as literals, so a non-English session
read a half-translated calendar: the unscheduled label and the two write-failure
toasts in its own language, and the loading screen, the error screen, the refusal
screen, the pull-to-refresh affordance, the whole quick-create dialog and the
record overlay's fallback title in English (objectui#10031).

Every one of those now reads a key. Two of them reuse keys the packs already
carried (`common.cancel`, `common.create`), one reuses `calendar.newEvent`, and
twelve are new under `calendar.`.

**The hook is chosen per site by one criterion, which the file already stated for
its existing call:** `useSafeTranslate`'s `tt(key, fallback)` passes no options to
i18next and therefore cannot fill a hole, so the two sentences that carry one —
the error prefix and the quick-create date line — read their key through
`useObjectTranslation`'s `t()` with an inline default, and every hole-free string
uses `tt()`.

**⚠️ A key added to `en` is not an `en`-only change in this repo**, and that is
worth stating because the cheap route looks available: the English fallback does
carry the English text at the call site, but the key-set invariant is a
pack-vs-pack one — every pack defines every `en` key — so it is answered by the
locale packs, not by the call site. All ten packs therefore carry the twelve new
keys, with real translations rather than the English value. The instrument that
says so is `all-locales-key-parity.test.ts`; `pnpm check:i18n-drift` prints which
of the two owns an addition.

**One rendered English string moved**: the loading placeholder's three ASCII full
stops became the typographic ellipsis, because its sentence is now a pack value
and `ellipsis-glyph-3878.test.ts` holds every pack value to U+2026. The refusal
screen's copy is byte-identical to what it rendered before, which is what keeps
the five suites that pin it green.
