---
'@object-ui/fields': patch
---

fix(fields): a readonly `password` field with no value now says "No value" (objectui#10639)

The readonly branch of the `PasswordField` widget never read its value. It drew
the eight-dot mask for every input, `null` included, so on a readonly form or
detail surface a credential that was never set looked exactly like one that is
set.

An empty value now renders the shared `EmptyValue` affordance, whose accessible
name is "No value". "Empty" is the rule the `password` cell has used since
objectui#8678: `null`, `undefined`, `''` and `[]` are empty. `{}` and a
whitespace-only string are stored values and keep the mask.

A stored value renders exactly what it rendered before: the same mask, in the
same element. The value is still never printed. The editable widget is
unchanged.
