---
'@object-ui/auth': patch
---

`AuthProvider` no longer asks `get-session` a second time when the console has just validated the stored session before rendering. The validated answer becomes the provider's first state, once per page load; signing in or out, switching organisation and refreshing the session read it from the server as before.
