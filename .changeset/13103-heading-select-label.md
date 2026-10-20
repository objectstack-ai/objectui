---
'@object-ui/components': patch
---

The record page heading labels a select `nameField` (objectui#13103). When an object's declared `nameField` (or `displayNameField`) is a select field, the record page H1 now shows the value's option label, for example `Config change`, instead of its stored value `config_change`. The heading's declared-pointer rung reads the record through the same option-label mapping its `titleFormat` rung already uses, so one select field reads the same through either rung. A text `nameField`, the order of the heading's rungs and the field-level-security reads are unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
