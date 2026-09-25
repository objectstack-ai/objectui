---
'@object-ui/types': minor
---

fix(types): a `filter-builder` condition's `value` is judged against its `operator` by the protocol's own rule

`FilterBuilderConditionSchema` declared `value: z.any()` and coupled nothing to the
operator. So `safeValidateSchema` (and `objectui check` / `objectui validate`) answered
green on filter conditions the protocol's `ViewFilterRuleSchema` refuses, such as
`{ field: 'amount', operator: 'between', value: 5 }` (objectui#10478).

The condition now re-parses its `{ field, operator, value }` projection through
`ViewFilterRuleSchema` from `@objectstack/spec/ui` and reports the rule's issues as its
own, on the condition's `value`, with the spec's message. The spec's checks are not
restated here, so the mirror follows the rule of whichever `@objectstack/spec` release is
installed. With `@objectstack/spec` 17.4.0, the release this lockfile resolves when this
lands, that means:

- `in` / `not_in` (and their aliases, such as `notIn`) take an array, and an absent value
  is refused. An empty list `[]` is still accepted;
- `between` takes exactly two bounds, `[min, max]`. A scalar, one bound, three bounds and
  the empty `[]` the builder draws for an untouched range row are all refused. A
  half-filled range such as `[0, '']` has two bounds and is accepted;
- whatever the operator, the value must be of a type the rule takes: a string, number,
  boolean, `null`, or an array of strings and numbers. An object, or an array holding a
  boolean, `null`, an object or another array, is refused.

The condition's `id`, which the builder needs and the spec rule does not declare, is kept
out of the projection, so it is still required and still accepted. A condition refused
for its `field`, `operator` or `id` reports only that issue.

**Breaking in semantics:** a document with a condition the protocol already refused, and
that used to validate, now fails `safeValidateSchema`, `objectui check` and
`objectui validate`. The fix is to author the value the operator takes. Released as
`minor` under this repository's version-alignment rule. The TypeScript types do not
change: `FilterBuilderCondition.value` stays `any`.
