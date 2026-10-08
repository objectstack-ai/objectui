---
'@object-ui/app-shell': minor
'@object-ui/types': minor
'@object-ui/i18n': minor
'@object-ui/cli': minor
---

New SDUI widget `cloud:workspace-timezone-notice`: one line on the Cloud welcome page naming the timezone a workspace was seeded with at creation (objectui#11930, the objectui half of objectstack-ai/cloud#2676).

**Clause-②: yes** — four published surfaces widen, and nothing that parsed or rendered before changes:

- the accept set of `AnyComponentSchema`, and so of `safeValidateSchema` and `objectui validate`, widens by one `type` literal, `cloud:workspace-timezone-notice`. `@object-ui/types/zod` exports one new schema, `CloudWorkspaceTimezoneNoticeSchema`, and `@object-ui/types` exports its TypeScript twin of the same name, a member of `AnySchema`;
- `@object-ui/i18n` adds one key, `cloudWorkspaceTimezoneNotice.seeded`, to all ten locale packs;
- `@object-ui/cli`: `objectui check` knows `cloud:workspace-timezone-notice` as a registered type;
- `@object-ui/app-shell` registers the widget, and its `sideEffects` array names the new module in its source and published spellings.

**Why.** The welcome page is static metadata, and nothing in a page's expression scope carries a per-organization value, so the page could not say which timezone the workspace was created with. The seed is available only from the org-scoped `GET /cloud/environment-entitlements` summary, as the additive `workspaceTimezoneSeed` string.

**What changed, in observable terms.**

- A page places the node with no props: `{ "type": "cloud:workspace-timezone-notice" }`. The widget reads the summary through the hook the environment list and `cloud:plan-status` already use, and when the summary carries `workspaceTimezoneSeed` it renders one muted line naming that zone, verbatim. In English: "The workspace timezone was set to Asia/Shanghai from your browser when the workspace was created. You can change it in Settings → Localization."
- It renders nothing when the summary carries no seed (workspaces created before the seed existed, and control planes that do not send it yet), while the summary loads, when the request fails or rejects, and when the body is not the `{ success, data }` envelope. A failed request does not throw.
- The line is text only: no link and no dismissal state.
- The node's `className` and `responsiveStyles` reach the line.
- The widget is registered under one key, `cloud:workspace-timezone-notice`. There is no bare `workspace-timezone-notice` fallback and no `app-shell:`-prefixed twin.
- `CloudWorkspaceTimezoneNoticeSchema` takes no prop: `properties` is optional and may only be `{}`, so any key in the bag, the zone included, is refused at `properties`. `body` and `children` are refused by name, because the widget reads neither.
