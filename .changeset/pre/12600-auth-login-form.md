---
'@object-ui/auth': minor
---

`LoginForm` gains an optional `hideHeader` prop and a password reveal toggle, and the shared auth form styles take the console login artboard's sizes (objectui#12600).

- **`hideHeader`** (default `false`) renders no header — no icon disc, no title, no description — for a host that draws its own. Left unset, the header renders exactly as before. Under SSO-only mode a headless form still shows the SSO-only description, as one line above the federated buttons.
- **Password reveal toggle.** The password field carries a 28 px show/hide button. Its accessible name comes from two new optional `LoginFormLabels` members, `showPasswordText` and `hidePasswordText` (defaults "Show password" / "Hide password").
- **Shared styles, every auth form:** `AUTH_INPUT_CLASS` and `AUTH_PRIMARY_BUTTON_CLASS` are 40 px tall (`h-10`, were `h-11`); the primary button is one flat `bg-primary` fill (was a `--primary` gradient); `AUTH_FIELD_LABEL_CLASS` is 13 px. `LoginForm`'s "Sign up" line is 13 px and its enterprise SSO button is 40 px with the inputs' radius.
- `LoginForm`'s root caps its width at 400 px (`sm:max-w-[400px]`) instead of fixing it there (`sm:w-[400px]`), so it fits a host card narrower than 400 px; wherever it had 400 px or more, nothing changes.

**Clause-②: yes.** Added: `LoginFormProps.hideHeader`, `LoginFormLabels.showPasswordText`, `LoginFormLabels.hidePasswordText`, all optional. Nothing is removed or renamed.
