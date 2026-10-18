---
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-timeline': patch
---

The `object-gantt` `markers` input and the `object-timeline` `items` and `mapping` inputs open their descriptions with the `@objectstack/spec` 17.7.0 row's own describe text, which is true of these renderers (objectui#11168's rule, followed at objectui#11717). The renderer-specific sentences after it are unchanged.
