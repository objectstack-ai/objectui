---
'@object-ui/console': patch
---

The console's share-link landing page (`/s/TOKEN`) sends a link's password in a request header, and a link that needs sign-in shows the sign-in path (objectui#11649).

- **The password leaves the URL.** The page used to send the password as a `?password=` query parameter on `GET /api/v1/share-links/TOKEN/resolve`. It now sends it in the `X-Share-Password` request header, the name the server reads, and never in a request URL, so it no longer ends up in a server, proxy or CDN log that records request URLs. The conversation `/messages` request sends the same header. That route checks the password too, so a password-protected shared conversation used to show "This conversation has no messages yet." It now shows its messages.
- **A sign-in-required link shows the sign-in path.** The server refuses with `401` for three different reasons, and the page used to show a password prompt for all of them. It now reads the response's `error.code`. `NEEDS_PASSWORD` shows the prompt and `WRONG_PASSWORD` shows it with "Wrong password.". `SIGN_IN_REQUIRED`, a link shared with signed-in users only, shows "Sign in required" and a "Sign in" button that opens `/login?redirect=` back to the link, with no password field. A `401` with any other code shows the server's message.
- **A password a header cannot carry is not sent.** A header value cannot hold a character above U+00FF, such as a Chinese character or an emoji, and the browser refuses to send it. The page does not send such a password and does not fall back to the URL. The prompt says that the password cannot be sent and asks the visitor to get a different password from the link's owner. Until the server defines an encoding for this header, a link whose password has such a character cannot be opened from the console.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed. The page's labels stay English literals.
