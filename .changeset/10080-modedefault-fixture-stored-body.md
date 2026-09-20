---
---

Split the `useNavigationOverlay.modeDefault` fixture that was carrying two pins in
one declaration (objectui#10080): the objectui#4550 TYPE pin keeps the
`SpecAuthoredInput<typeof NavigationConfigSchema>` annotation and now authors a key
the spec still declares, while the objectui#9874 BEHAVIOUR pin's legacy body — the
`view` member `@objectstack/spec` 17.5.0 retired under ADR-0049 — is fed as the
stored `Record<string, unknown>` it is. Test only; no package is released by this
change, and no assertion changed.
