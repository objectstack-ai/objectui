---
'@object-ui/app-shell': minor
'@object-ui/types': minor
'@object-ui/i18n': minor
'@object-ui/cli': minor
---

Two Cloud SDUI widgets are retired: `cloud:onboarding-next`, the Welcome page's next-step block, and `cloud:plan-status`, the pricing page's current-plan marker (objectui#12954). The Cloud control plane was their one consumer, and objectstack-ai/cloud#3010 replaced both: the home's next step is declared `element:button` nodes over `GET /api/v1/cloud/home`, and the pricing page marks the current plan with a `visibleWhen` on the same summary. At retirement, hotcrm `main` (`3b05ae7`) and objectstack `main` (`0b44840dfd`) registered and authored neither type. They are retired at once, with no deprecation alias. This is breaking for a page or host that still names one of them; it is marked `minor` under this repository's version policy.

- **SDUI widget `cloud:onboarding-next`**, also registered as `app-shell:cloud:onboarding-next`. FROM: `@object-ui/app-shell` registered both keys. TO: neither is registered. A page that still names one draws the unknown-component panel, and `objectui check` no longer counts either key among the known component types.
- **SDUI widget `cloud:plan-status`**. FROM: `@object-ui/app-shell` registered it. TO: not registered, with the same two consequences.
- **Schema `CloudPlanStatusSchema`** in `@object-ui/types`: the TypeScript interface from the package entry, and the zod arm from `@object-ui/types/zod`, which was also a member of `AnyComponentSchema`. FROM: exported, and a `cloud:plan-status` node validated against the arm. TO: there is no such export, so importing it fails to compile. `AnyComponentSchema` keeps a refusal arm for the literal, which is not exported, so `objectui validate` refuses a `cloud:plan-status` node BY NAME at `type`, and the message names the remedy: a `visibleWhen` on the page's summary. `CloudWorkspaceTimezoneNoticeSchema` stays.
- **Locale keys `cloudOnboarding.*`** (`hintCreate`, `hintReady`, `createEnvironment`, `openWorkspace`, `manageEnvironments`) **and `cloudPlanStatus.current`** leave all ten built-in packs of `@object-ui/i18n`.

The two widget modules also leave the `sideEffects` array of `@object-ui/app-shell`. `useEnvironmentEntitlements` stays: the environment list and `cloud:workspace-timezone-notice` still read it.

Fix for a page that still names either widget: compose it from generic blocks, as objectstack-ai/cloud#3010 did — declared `element:button` nodes over the home summary in place of `cloud:onboarding-next`, and a `visibleWhen` on the same summary in place of `cloud:plan-status`.

Clause-②: no (narrowing)
