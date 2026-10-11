---
'@object-ui/app-shell': minor
'@object-ui/console': minor
---

A `position` decision output lists the position registry and commits position names (objectui#7611, objectstack ADR-0131 D3/D4).

- **What the approver sees.** In the Approve and Reject dialogs (the Approval Center and the record page both decide through `DeclaredActionsBar`), a `position` output is a select over the `position` items the registry serves, read through the console's metadata store (`ensureType('position')`), the same reader the sharing-rule recipient picker lists positions through. Each option is labelled by the position's `label`, else its name, and the list is sorted by name. It used to be a `sys_position` lookup, which offered nothing on a database without `sys_position` rows.
- **What the flow receives.** The decide body carries the picked positions' machine names (an array when the output is `multiple`). That is what the spec says the output collects (objectstack#22710), and what the engine's `resolveAs: 'position'` matches against `sys_user_position.position`. The lookup committed `sys_position` row ids instead.
- **Without a metadata store.** A surface rendered outside a `<MetadataProvider>` has no registry reader, so a `position` output there is the free-text box an untyped output gets, the same fallback the recipient picker takes. An empty registry is not that case: it renders the select with no options.
- `department` and `team` outputs are unchanged: they are still record lookups and commit record ids.
