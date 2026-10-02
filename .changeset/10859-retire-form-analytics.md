---
'@object-ui/plugin-form': minor
---

refactor(plugin-form)!: retire the `form-analytics` node type key (objectui#10859, batch 8 phase 2b)

**BREAKING (authoring):** the plugin no longer registers `form-analytics` (and with it `plugin-form:form-analytics`). `objectui validate` refused a `form-analytics` node at `type`, and nothing in this repository, its examples or objectstack authored it. A node authored `type: "form-analytics"` now renders the "Unknown component type" panel. `FormAnalytics` stays a named export.

Migration:

- `{ "type": "form-analytics", "formId": …, "formTitle": …, "metrics": … }` → mount `FormAnalytics` directly with the same three props.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
