---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The login page says when the server cannot be reached, and offers "Sign up" only once the server has said whether it accepts sign-ups (objectui#11806). This applies to the console's own `/login` and to `DefaultLoginPage`.

Both pages read `/api/v1/auth/config` to decide the "Sign up" offer. They held that config as `null` both while the read was pending and after it failed, and `decideSignUpOffer` answers `null` as "offer the link". So with the server down the page drew a normal-looking form and offered "Sign up", and the visitor found out only when they submitted.

**Behaviour change.**
- While the config read is pending, neither page shows the "Sign up" link. The form's own spinner shows as before.
- When the read fails, the page shows "Cannot connect to server", the hint to check the network or the backend, and a Retry button, in place of the form. The auth client has already retried the read itself by then. The "Sign up" link stays hidden.
- Retry reads the config again. While that read is in flight the button reads "Retrying…" and the form stays hidden. When the server answers, the form returns, and "Sign up" follows that answer exactly as before.
- When the server answers the first read, nothing changes.

**Clause-②: no.** No export, prop, type member or accepted value changes. `decideSignUpOffer` and its answers are unchanged: the pages consult it only once the read has answered. The text comes from existing `en` keys: `console.error.connectionFailed`, `console.error.checkServer`, `console.actions.retry` and `console.actions.retrying`.
