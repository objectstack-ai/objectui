---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

The screen-flow runner names the flow by its label, in the user's language (objectui#11092, the objectui half of objectstack#20318).

Since `@objectstack/spec` 17.6.0 every answer that evaluated a flow carries the flow's authored label as `AutomationResult.flowLabel` (objectstack#20633). `FlowRunner` now resolves the flow's display name in this order: the active language's `flows.FLOW.label` from the app's translation bundle, then the served `flowLabel`, then the flow's API name. The bundle is the one the runner already reads for screen headings and field copy, and the lookup is the spec's own `translateFlow`.

Where it shows:

- **The runner header.** A line above the screen's heading names the flow. The heading is still the step's own title (or the `flowRunner.title` fallback), and it is still the dialog's accessible name.
- **The completion toast.** `Flow "{{flow}}" completed` names the flow by the resolved label instead of its API name. A flow's own `successMessage` still takes precedence. The message key and its translations are unchanged.

All three places that open the runner pass the label through: a flow action on a list or toolbar, a flow action on a record page, and the developer Flow Runs page's Test Run panel. A resume answer that pauses on a further screen carries the label forward.

Against a server older than objectstack#20633 no label is served, so the header line and the toast show the flow's API name, unless the app's bundle translates `flows.FLOW.label` for the active language.

**Clause-②: yes (widening).** The exported `ScreenFlowState` type gains one optional member, `flowLabel`, typed by the contract as `Pick` of `AutomationResult`'s `flowLabel` (an optional string). `FlowRunnerProps.state` accepts it through that type. No prop, export or i18n key is added or removed, and no existing member changes type.
