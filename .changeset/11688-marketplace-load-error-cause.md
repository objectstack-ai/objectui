---
'@object-ui/app-shell': patch
---

Browse Marketplace now says why the catalog failed to load, and no longer draws "No apps have been approved for the marketplace yet." under the error (objectui#11688).

A refusal the server answered in plain text, such as an egress proxy's `403` "Host not in allowlist: cloud.objectos.ai", was shown as the bare status text ("Forbidden"), and every load failure carried the "check that it is online" hint. Now:

- the error shows the server's own text: a JSON error's message, as before, or the body of a `text/plain` refusal. Any other body that is not JSON, such as an HTML error page, still shows the status text;
- the "check that it is online" hint is shown only when no server answered (a network failure, a CORS refusal) or the server answered `502`, `503` or `504`. A refusal such as a `401` or `403` shows its cause without it;
- the empty state is drawn only when the catalog loaded empty, and the "Your organization" packages and the installed count still appear when the public catalog fails to load.

The package detail page reads its load through the same request helper, so a plain-text refusal there now shows its text too.
