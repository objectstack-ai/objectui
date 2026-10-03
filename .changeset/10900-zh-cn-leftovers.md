---
'@object-ui/core': minor
'@object-ui/auth': minor
'@object-ui/react': patch
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

Four Console surfaces that read English under a zh-CN session now read the session's
language (objectui#10900). English stays the default.

- **The generic action success toast.** When an action declares no `successMessage`, the
  runner falls back to "Action completed successfully".
  That fallback now goes through a translator: `ActionRunner.setTranslator(translate)` is
  new in `@object-ui/core`, and `<ActionProvider>` and `useActionRunner` in
  `@object-ui/react` install the session's `t` on the runner they build. The pack key is
  `actions.completedSuccessfully`. An author's `successMessage` still reaches the toast
  untranslated, and a runner with no translator installed still toasts the English sentence.
- **The social sign-in buttons on the login and sign-up pages.** `SocialSignInButtons`
  takes a new `buttonText` prop, a template whose `{provider}` is replaced with the
  provider's display name; unset, the buttons keep "Continue with {provider}" and
  "Sign up with {provider}". `LoginForm` and `RegisterForm` take a new `socialButton`
  label and pass it, with their existing `orText` label, to the buttons. `orText` was
  documented as the divider label but rendered nowhere; it now sets the divider under the
  buttons, and its documented default is corrected from "or" to "or continue with email",
  the text that divider has always shown. The console's login and sign-up pages and
  `@object-ui/app-shell`'s `DefaultLoginPage` / `DefaultRegisterPage` pass the new
  `auth.login.*` and `auth.register.*` `socialButton` / `orText` keys. The provider's display
  name is inserted as-is: the component's own label for the branded providers it knows,
  otherwise the name the server reports.
- **Build Doctor.** The build conversation's Build Doctor button (its accessible name and
  both tooltips) and the title of the drawer it opens read `console.ai.buildDoctor`,
  `console.ai.buildDoctorTitle` and `console.ai.buildDoctorDisabledTitle`.
- **Setup → marketplace.** On `system/marketplace` and the pages under it, the breadcrumb
  segment after System reads `console.breadcrumb.marketplace` instead of the humanized URL
  slug; other `system/*` segments are unchanged. The zh marketplace search placeholder
  reads 「按名称或标识搜索应用…」 instead of 「按名称或 manifest ID 搜索应用…」. The search
  itself is unchanged: it matches the display name, the identifier and the description.

All ten locale packs carry the nine new keys; no existing `en` value changes.

**Clause-②: yes** — besides the nine pack keys, the public surface widens by four optional
members: `ActionRunner.setTranslator`, `SocialSignInButtonsProps.buttonText`,
`LoginFormLabels.socialButton` and `RegisterFormLabels.socialButton`. Nothing is removed,
renamed or narrowed, no accept set changes, and `@object-ui/react` exports nothing new.
