---
'@object-ui/plugin-designer': patch
---

`MetadataFieldsPage` shows the per-field prescription when the spec refuses a save, not only the refusal headline (objectui#11302).

A field the spec refuses (for example a name like `Bad Name`, or `__proto__`) made the page show only the 422's headline, "object/NAME failed spec validation: N issues — …", while the sentence telling the author what to do ("Field names must be lowercase snake_case", "Rename the key") rode in the error's structured issues and never reached the screen. The page now renders its errors through `formatMetadataError` from `@object-ui/data-objectstack`, the same reader the Studio surfaces use: one line per issue, naming the field and the fix. Every other failure still shows its own message.
