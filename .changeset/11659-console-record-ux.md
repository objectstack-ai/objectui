---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Console, record page and Studio copy from the 2026-10-05 cloud acceptance run (objectui#11659).

**The cloud home's primary button reads "Open workspace" (zh 「进入工作区」), not "Open Production".** A new customer has exactly one environment, and "production" is control-plane vocabulary. The `cloud:onboarding-next` widget's ready-state button now resolves `cloudOnboarding.openWorkspace`, which replaces `cloudOnboarding.openProduction` in all ten language packs, and the hint under it (`cloudOnboarding.hintReady`) says "workspace" instead of "production environment". The button still navigates to the page's `openProductionUrl`; the page-metadata contract is unchanged.
