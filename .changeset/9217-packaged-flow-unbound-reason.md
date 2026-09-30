---
'@object-ui/app-shell': minor
---

Setup › Packaged automation shows the platform's reason for a packaged flow the engine has not armed, verbatim and in muted text under the flow name (objectui#9217).

**What it was.** The page read only `name` and `enabled` from `GET /api/v1/automation/_status`. A time-triggered flow left unarmed because the deployment has package-authored scheduled work switched off (`OS_AUTOMATION_SCHEDULED_WORK_ENABLED` unset, the default in every posture) showed as a plain "On", the same as a flow that runs. A flow whose trigger failed to bind looked identical.

**What changed, in observable terms.**

- When a `_status` row carries `reason` (`FlowRuntimeState.reason`, `@objectstack/spec` 17.5.0), the sentence appears under the flow's name exactly as the platform sent it. A deployment-policy row shows the platform's policy sentence, which names the variable that switches scheduled work on. A binding-failure row shows the platform's failure sentence.
- The sentence is muted text. It is not an alert and has no error styling, and the page does not parse, compare or reword it, as the contract asks ("Consumers RENDER it; do not parse it").
- A row without a `reason` renders exactly as before. That covers bound flows, disabled flows, flows with no trigger, and older backends that do not send the field. A `reason` that is not a non-empty string is ignored.
- No dependency, locale key or copy of a platform sentence is added.
