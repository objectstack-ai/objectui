---
"@object-ui/types": minor
---

**Breaking (types):** a form select option (`SelectOption` and its zod twin `SelectOptionSchema`) carrying `kind` or `default` is now refused (objectui#12736).

The SDUI form-option face now stops at the spec's form-view option boundary, `FormSelectOptionSchema` (`@objectstack/spec/ui`), read by reference. That option leaves out the object-field option's lifecycle `kind` (`open` / `won` / `lost`) and per-option `default`. Both used to type-check and parse clean on a form option, and nothing on the form path read either. Now a typed `SelectOption` literal refuses both as excess properties, and `SelectOptionSchema` refuses a value in either key by name instead of stripping it.

Declare both on the object field's own `options` entry instead. `SelectOptionBase` and the object-metadata face `SelectOptionMetadata` still carry `kind` and `default`, unchanged. The form face keeps its named divergences: `value` widened to `string | number | boolean`, objectui's `visibleWhen` wire shape, and the objectui-only `disabled` and `icon`.
