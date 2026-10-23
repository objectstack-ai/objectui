---
'@object-ui/plugin-detail': patch
---

The inline-edit save bar shows an object-level rule's refusal as the rule's own message, without a field label (objectui#13292).

The server names an object-level rule (a `script` rule, or one that lists no fields) with the `_record` sentinel. The bar used to print that sentinel as a field label, so the banner read `_record: …`. Now an entry that names `_record`, or names no field of the record, is shown alone in the banner and is not published as a per-field hint. Field-level entries are unchanged: they keep their label and their hint beside the input.
