---
'@object-ui/types': patch
---

docs(types): the `WidgetInput` divergence docblock lists the serializer's key list with `of` (objectui#10337)

Clause 2 of the `WidgetInput` docblock said `sdui-parser`'s manifest serializer forwards
six keys per input and listed them without `of`. `manifestFromConfigs` has forwarded `of`
since objectui#8067, so a reader of the published declaration learned that `of` is not
published when it is. The clause now reads "a fixed key list per input, `of` included
since objectui#8067" and lists all of them, the uncounted wording `ComponentInput`'s own
docblock in `base.ts` already uses. The clause's conclusion is unchanged: none of the
five tombstoned `ComponentInput` keys is on that list. Comment only, with no type or
runtime change.
