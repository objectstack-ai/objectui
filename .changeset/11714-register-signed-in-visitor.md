---
'@object-ui/app-shell': patch
---

`DefaultRegisterPage` sends a signed-in visitor on to `/` instead of leaving them on an empty page (objectui#11714). The page asks the bootstrap probe only about a visitor who is signed out, so under the default `invite_only` audience posture a signed-in visitor got an offer that never settled: an empty layout with no text, no form and no link. Under `open` they got the sign-up form. The page offers nothing a signed-in user can use, so once the session check answers with a user it now sends them where it sends a visitor after a successful sign-up, `/`, replacing `/register` in the history, without waiting for the auth config or the probe. The console's own register page already did this.

A signed-out visitor is offered what objectui#11705 describes. The page now waits for the session check before it offers anything or probes, so a visitor who turns out to be signed in is never shown the form first. `decideSignUpOffer` is unchanged, and so is `DefaultLoginPage`. Honouring `?redirect=` after a sign-in or sign-up is not part of this change. The package README's sign-up table gains a row for a signed-in visitor, and its `useSignUpOffer` example answers `signed-in` for one.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed, and no accepted input widens.
