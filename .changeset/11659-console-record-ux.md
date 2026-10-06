---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Console, record page and Studio copy from the 2026-10-05 cloud acceptance run (objectui#11659).

**The cloud home's primary button reads "Open workspace" (zh 「进入工作区」), not "Open Production".** A new customer has exactly one environment, and "production" is control-plane vocabulary. The `cloud:onboarding-next` widget's ready-state button now resolves `cloudOnboarding.openWorkspace`, which replaces `cloudOnboarding.openProduction` in all ten language packs, and the hint under it (`cloudOnboarding.hintReady`) says "workspace" instead of "production environment". The button still navigates to the page's `openProductionUrl`; the page-metadata contract is unchanged.

**The create-workspace dialog asks for the name only.** `CreateWorkspaceDialog` no longer shows the "URL slug" field: the customer never sees the slug take effect at this step. The slug is still generated from the name, by the same rule as before, and sent with the create call; the owner can change it later in organization settings. Because the slug is no longer the user's to fix in the dialog, a slug collision (`ORGANIZATION_ALREADY_EXISTS` or `ORGANIZATION_SLUG_ALREADY_TAKEN`) is retried with a short random suffix, up to three attempts in all; any other refusal is shown as before. The `workspace.slugLabel` and `workspace.slugHint` pack keys are left in place, now unread.
