---
'@object-ui/console': patch
---

The developer Flow Runs page's flow picker names each labelled flow by its label again, on the list a real server serves (objectui#12783).

objectstack's metadata list answers `meta.getItems('flow')` with flattened items: each flow's `name` and `label` sit on the item itself, with no `spec` member. The page read the name from either form, but the label from `spec.label` only, so against a server every flow was listed by its API name alone, for example `showcase_batch_reminders`. The label is now read the way the name is, `spec` first and then the item itself, so the picker shows `Batch Task Reminders (Loop) (showcase_batch_reminders)`, the `label (name)` form the page builds. A flow that declares no label still shows its bare name.

Nothing else on the page changes: no export, prop, type member or i18n key is added or removed.
