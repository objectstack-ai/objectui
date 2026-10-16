---
'@object-ui/auth': minor
---

`LoginForm` no longer tells an SSO-enforced environment's users to use a password (objectui#12682).

- **While the auth config resolves**, the header shows its title and no description. It used to show the password form's description ("Enter your email and password to continue", or the `description` the host passed) because SSO enforcement was not known yet. Once the config answers, the description is what it was: `labels.ssoOnlyDescription` under SSO-only mode, `description` otherwise. A failed config read still falls back to the password form and its description.
- **Under SSO-only mode** (`features.ssoEnforced`), the provider buttons are no longer followed by an "or continue with email" divider with no email form under it. The divider now renders only while the password form is shown, so it comes back with the form when "Use a password instead" is clicked. A server that does not enforce SSO keeps the divider exactly as before.
- **`SocialSignInButtons` gains `hideDivider`** (optional, default `false`), which omits the divider under the buttons. Left unset, the component renders exactly as before, so `RegisterForm` and every other caller are unchanged.

**Clause-②: yes.** Added: `SocialSignInButtonsProps.hideDivider`, optional. Nothing is removed or renamed.
