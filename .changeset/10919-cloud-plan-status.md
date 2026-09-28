---
'@object-ui/app-shell': minor
'@object-ui/types': minor
'@object-ui/i18n': patch
'@object-ui/cli': patch
---

New SDUI widget `cloud:plan-status`: a "Current plan" badge for one plan card on the Cloud pricing page, shown when that card's plan is the organization's plan (objectui#10919).

**Clause-②: yes** — the accept set of `AnyComponentSchema`, and so of `safeValidateSchema` and `objectui validate`, widens by one `type` literal, `cloud:plan-status`, and `@object-ui/types/zod` exports one new schema, `CloudPlanStatusSchema`. Nothing that parsed before is refused now.

**Why.** The pricing page is static metadata, and nothing in a page's expression scope carries the organization's plan, so the page could not tell which of its cards the organization is already on. The plan is available only from the org-scoped `GET /cloud/environment-entitlements` summary.

**What changed, in observable terms.**

- `@object-ui/app-shell` registers `cloud:plan-status`. A page places one node on each plan card and names that card's plan code in `properties.plan`: `{ "type": "cloud:plan-status", "properties": { "plan": "free" } }`. The widget reads the summary through the hook the environment list already uses, and renders the badge when the summary's `plan` equals `properties.plan`. The comparison is exact, so `Free` does not match `free`.
- The widget renders nothing on every other card, while the summary loads, when the request fails, and when the body is not the `{ success, data }` envelope. It never guesses a plan.
- The node's `className` and `responsiveStyles` reach the badge. Each node reads the summary itself, so a page with three cards makes three requests.
- The widget is registered under one key, `cloud:plan-status`. There is no bare `plan-status` fallback and no `app-shell:`-prefixed twin.
- `@object-ui/types/zod` exports `CloudPlanStatusSchema`, a member of `AnyComponentSchema`. `properties` is required and must be exactly `{ plan }`, with `plan` a non-empty string. A missing bag, a missing or empty `plan`, and any other key in the bag are each refused at that path.
- `body` and `children` are refused by name on this node, because the widget reads neither.
- `plan` is not an enum: the plan catalog belongs to the control plane, and ObjectUI does not list its codes.
- `@object-ui/i18n` adds `cloudPlanStatus.current` ("Current plan") to all ten locale packs.
- `@object-ui/cli`: `objectui check` knows `cloud:plan-status` as a registered type.
