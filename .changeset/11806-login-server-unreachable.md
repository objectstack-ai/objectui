---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The login and register pages say when the server cannot be reached, and offer sign-up only once the server has said whether it accepts sign-ups (objectui#11806). This applies to the console's own `/login` and `/register`, and to `DefaultLoginPage` and `DefaultRegisterPage`.

All four pages read `/api/v1/auth/config` to decide what a visitor is offered. They treated a failed read like a server that sends no config, and `decideSignUpOffer` answers that as "offer it". The login pages also held the config as `null` while the read was pending. So with the server down, `/login` drew a normal-looking form and offered "Sign up", `/register` drew the full registration form, and the visitor found out only when they submitted.

**Behaviour change.**
- While the config read is pending, the login pages show their form behind its own spinner, with no "Sign up" link. The register pages show no form, as before.
- When the read fails, every page shows "Cannot connect to server", the hint to check the network or the backend, and a Retry button, in place of the form. The auth client has already retried the read itself by then. Nothing is offered.
- Retry reads the config again. While that read is in flight the button reads "Retrying…" and the form stays hidden. When the server answers, the page shows what that answer decides, exactly as before: the form, the "Sign up" link, the by-invitation notice, or, on `/register`, the bounce to `/login`.
- When the server answers the first read, nothing changes.

`packages/app-shell/README.md` documents the two new states in its sign-up table. Its `useSignUpOffer` recipe for hosts now asks `decideSignUpOffer` only once the read has answered, and answers `unreachable` for a failed read.

**Clause-②: no.** No export of the package entry, prop, type member or accepted value changes. `decideSignUpOffer` and its answers are unchanged: the pages consult it only once the read has answered. The text comes from existing `en` keys: `console.error.connectionFailed`, `console.error.checkServer`, `console.actions.retry` and `console.actions.retrying`.
