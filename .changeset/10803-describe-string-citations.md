---
'@object-ui/types': patch
---

fix(types): eleven zod `.describe()` strings no longer point at an objectui issue that answers 404

The runtime descriptions of eleven members of the published zod mirrors ended with, or
carried, a pointer to an objectui issue that answers 404: `CheckboxSchema.wrapperClass`,
`TreeViewSchema.nodes`, `ObjectMapSchema.objectName`, `ObjectGanttSchema.objectName`,
`ObjectGanttSchema.data`, `TooltipSchema.trigger` / `content` / `children`, and
`ContextMenuSchema.triggerClassName` / `contentClassName` / `modal`. A reader of a zod
`description` has no repository to resolve a commit against, so each dead pointer is dropped
rather than replaced (objectui#10803). On `ObjectGanttSchema.data` the clause that carried it,
"undeclared on either face until" that issue, goes with it, leaving
"Data source configuration — read FIRST by resolveRecordSourceConfig": the same shape as its
`ObjectMapSchema.data` twin, which names `getDataConfig`.

Nothing else in any string moves, and no key, path, accept set or refusal changes: every
document that parsed before parses the same way.
