---
'@object-ui/app-shell': patch
'@object-ui/i18n': minor
---

A free-plan organization's environment list no longer offers a primary button that opens a paywall dialog (objectui#12190). The maintainer's rule is that no primary button opens a paywall (objectstack-ai/cloud#2775).

**What changed, in observable terms.**

- When the organization owns its production environment and its plan does not allow development environments (the entitlement summary's `development.canCreate` is `false`), the toolbar used to show a primary "Add environment" button whose click opened the "Development environments are a paid feature" dialog. It now shows an outline mark with a lock icon, "Development environments · Team plan and up" (zh 「开发环境 · 团队版起」), in place of the create action. The mark is a plain link to the entitlement summary's `upgradeUrl`, resolved the way the entitlement dialog resolves its upgrade link: a control-plane-relative path is prefixed with the control-plane origin, and an absolute URL opens in a new tab. It opens no dialog.
- When the summary carries no `upgradeUrl`, no mark is drawn (objectui#12983: the control plane sends `upgradeUrl` only to a viewer who can upgrade). No URL is composed in the console (objectui#10437).
- A `?runAction=create_environment` deep link in that state is still consumed (stripped from the URL), and now opens nothing: it used to open the same dialog.
- The mark appears only where the create action would have rendered, so a create action filtered out by placement or by the capability gate still leaves no mark, as before.
- Unchanged: the "Set up your production environment" and "Add development environment" states, the loading skeleton, and the dialog shown when the server refuses a create (`DEV_ENV_PLAN_LOCKED`, `DEV_ENV_LIMIT`, `PRODUCTION_ENV_LIMIT`).
- The element's test id changes from `environment-add-upgrade` to `environment-development-locked`.

**Locale packs (all ten).**

- Added `planTier.teamAndUp`, the tier label, keyed by the tier so that every surface marking a plan-locked feature reuses it. zh: 「团队版起」, following the cloud control plane's zh plan label.
- Added `environment.developmentLocked`, the mark's text, with a `{{tier}}` placeholder that the toolbar fills from `planTier.teamAndUp`.
- Removed `environment.addEnvironment`: its one reader was the retired button.

**Exports.** No export of `@object-ui/app-shell` changes. Two internal pieces the toolbar no longer uses are removed: the `upgradeDialogSpec` builder in `environment/entitlements.ts`, and the `onUpgrade` prop of the internal `EnvironmentListToolbar`, which `ObjectView` no longer passes. Neither was ever re-exported from the package entry.

**Breaking for `@object-ui/i18n` consumers: `environment.addEnvironment` is removed.** The key is gone from all ten locale packs and from the published `TranslationKeys` type (`typeof en`). A consumer that calls `t('environment.addEnvironment')` now gets the key echoed back, and code that reads the key off a published pack object or off `TranslationKeys` no longer compiles. There is no replacement key: the "Add environment" button it labelled is retired. The plan-locked state's text is now `environment.developmentLocked`, and its `{{tier}}` placeholder is filled from `planTier.teamAndUp`. Both of those keys are added (listed above). Under this repository's version policy a breaking change is declared `minor` with the break described here, never `major`, so `@object-ui/i18n` is `minor`. `@object-ui/app-shell` stays `patch`: none of its exports changes.
