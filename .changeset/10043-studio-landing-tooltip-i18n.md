---
'@object-ui/console': patch
'@object-ui/i18n': patch
---

Localize the Studio front door's wordmark tooltip (objectui#10043).

The `/studio` landing's wordmark carried its `title` tooltip as a hard-coded literal
in one language, outside i18n entirely — the only user-visible string on that surface
that never reached a translation bundle, so every other locale read it in that one
language. AGENTS.md commandment #-1 names titles in the categories it covers.

It now resolves through `useObjectTranslation` and a new `console.studio.backToHome`
key, which is the mechanism the rest of this app's chrome already uses (the same route
objectui#4024 took for the settings screen, whose chrome was hard-coded beside a keyed
sibling). The key ships in all ten locale packs, and each pack's value is that pack's
own existing wording for this affordance rather than a new translation — the sibling
Home button one route away inside the same frame says the same thing, and the two must
not name the same home two different ways.
