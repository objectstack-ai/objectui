---
'@object-ui/console': patch
---

The console's sign-in page no longer reads `/api/v1/i18n`, and the application's translations and locale list load with the session's credentials once signed in (objectui#12034).

The two loaders the console hands to `I18nProvider` used to run as soon as the page loaded, before the session was known, with a bare `fetch`. So the sign-in page read `/api/v1/i18n/translations/:locale` and `/api/v1/i18n/locales` as an anonymous caller, and a signed-in page load sent no bearer with them. Where no session cookie rides along (a console built with an absolute `VITE_SERVER_URL`), a framework that refuses an anonymous `/i18n` read (objectstack-ai/objectstack#22432) answers both with 401, and a signed-in user's application labels stay in the language they were authored in.

- **Signed out:** neither loader sends a request. The sign-in page renders from the built-in language packs.
- **Signed in:** both loaders wait for the console's `AuthProvider` to answer for the page load, then read through `createAuthenticatedFetch()`, the request path the data adapter uses (bearer, `X-Tenant-ID`, `Accept-Language`). Every console sign-in ends in a full-page navigation, so the page load after sign-in is the one that reads them.

Nothing published changes: no export, prop or language-pack key is added, and `I18nProvider` is used through its existing `loadLanguage` and `loadLocales` props.
