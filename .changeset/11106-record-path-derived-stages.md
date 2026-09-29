---
'@object-ui/plugin-detail': patch
---

A `record:path` block that sets `statusField` and leaves out `stages` now shows the status field's picklist as its stages, instead of the "record:path — no stages configured" placeholder (objectui#11106).

`@objectstack/spec` makes `stages` optional on `record:path` and describes it as "Explicit stage definitions (if not using field metadata)". Until now only the synthesized default record page derived the stages from field metadata; a page an author built, for example in Studio with only the status field set, got the placeholder even though the object declared the picklist.

- **Derived from the picklist.** When `stages` is absent, `RecordPathRenderer` reads the status field's options from the object definition the host already binds to the record context (`objectSchema`), through `deriveStages`, the same rule the default page uses. The record's current value is highlighted, and the labels take the app's picklist translations like authored stages do.
- **Authored stages still win.** An explicit `stages` list renders as written, and an explicit empty list still shows the placeholder.
- **A field without picklist options keeps the placeholder, which now names the field**, for example `record:path — no stages configured, and field "stage_note" has no picklist options to derive them from`. With no object definition bound, the placeholder keeps its plain wording.
