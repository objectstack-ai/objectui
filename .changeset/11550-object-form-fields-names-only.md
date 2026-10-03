---
---

Test-only change in `@object-ui/plugin-form`; no package is released and the renderer is unchanged (objectui#11550). The `object-form` `fields` fixtures name their fields as strings: `fieldSecurityPayload`, `systemManagedPayload` and the flat drawer shape in `drawerFirstLoadWindow-10190` used `{ name, label }` entries whose `label` the form never read. The `{ name }` row in `objectFormFieldsMembers-8071` no longer pins a tolerated spelling. It now pins that the `ObjectFormSchema` mirror refuses the entry at `fields.0` while a STORED one still draws, and the master-detail hand-off row in `topLevelFieldsWarnCoverage-8847` is relabelled as the same stored read.
