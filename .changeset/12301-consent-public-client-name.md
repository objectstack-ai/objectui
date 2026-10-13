---
'@object-ui/console': patch
'@object-ui/i18n': minor
---

The OAuth consent page names the requesting application by its registered name again, and never shows the raw `client_id` in the name's place (objectui#12301).

The page looked the client up at `/api/v1/auth/oauth2/applications/ID/public`, a route no server mounts. Every lookup answered 404, and the page then named the application by its raw `client_id`. It now asks the route the server serves, `GET /api/v1/auth/oauth2/public-client?client_id=…` — the same URL `@objectstack/client`'s `oauth.applications.getPublic` builds — once the user is signed in, because that route needs a session. It reads the name from the answer's `client_name` and the logo from `logo_uri`.

When the lookup gives no name (an unknown or disabled client answers 404; any other non-2xx, a network failure, or an answer without `client_name` counts the same), the page says "This application could not be identified." and shows the raw id under a "Client ID" label, in a code face. While the lookup is in flight, the page names "an application" and shows no id.

**Clause-②: yes (widening)** — `@object-ui/i18n`'s ten language packs gain two keys, `oauth.consent.unidentified` and `oauth.consent.clientId`. No key is removed or changed, and nothing else on either package's entry moves: no export, prop or type member.
