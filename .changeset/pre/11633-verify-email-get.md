---
'@object-ui/console': patch
---

The console's `/verify-email?token=…` page verifies the address again (objectui#11633). It used to send the token as `POST /api/v1/auth/verify-email` with a JSON body. better-auth serves that route as GET only, so the server answered 404. Every valid token then showed "Verification failed: 404", and the account stayed unverified.

The page now calls `GET /api/v1/auth/verify-email?token=…`, the route the server already serves and the one the mailed link targets. It sends no `callbackURL`, so the route answers JSON instead of redirecting. The page shows the success state only for that JSON receipt (`{ status: true }`), which the route also returns when the address is already verified. A garbage or expired token gets a 401 from the server, and the page shows the error state with the server's reason. A 2xx that is not the receipt, such as an HTML page, also shows the error state. The page's states, copy and links are unchanged.

**Clause-②: no.** Nothing on any package entry changes. No export, prop, type member or i18n key is added or removed.
