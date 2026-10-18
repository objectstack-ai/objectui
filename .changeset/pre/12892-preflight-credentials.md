---
'@object-ui/console': patch
---

The console's boot session check now keeps the renewed session cookie (objectui#12892). Before the app renders, the console checks the stored sign-in token with one `get-session` request. That request sent no cookie (`credentials: 'omit'`). Once a session was older than the server's renewal age, the request extended the session on the server and sent back a renewed cookie, but the browser dropped it. The session then outlived the cookie the browser kept, and every path that reads only the cookie saw a signed-out user. The request now sends `credentials: 'include'`, so the browser stores the renewed cookie. A stale stored token is still detected and cleared: the server judges a request that carries both by its Bearer token.
