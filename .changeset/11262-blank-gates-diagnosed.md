---
'@object-ui/types': minor
'@object-ui/core': patch
'@object-ui/plugin-form': patch
---

A blank gate predicate is diagnosed on the three paths that still drew it in
silence, and objectui's two gate mirrors whose protocol key refuses a blank now
refuse it too (objectui#11262, ADR-0137 D4 and D1). **No drawn verdict moves:** a
blank gate is still "no gate".

**Diagnosed, verdict unchanged (`@object-ui/core`, `@object-ui/plugin-form`).**
ADR-0137 D4 says a blank gate predicate is "diagnosed, never a silent `true`".
objectui#8069 diagnosed the `{ dialect: 'cel' }` route; three paths stayed silent,
and each now reports through that same guard (`evalFieldPredicate`'s `[blank]`
report, deduped per blank text and locator):

- `ExpressionEvaluator.evaluateCondition`'s legacy path: a bare `''`, a
  whitespace-only string, and an envelope without `dialect` whose `source` is
  blank. These are the values `SchemaRenderer`'s visibility legs pass through
  raw. The answer is still `true` in every mode, `throwOnError` included. A
  caller that passes `onFault` receives the `[blank]` reason there; every other
  caller gets the built-in warning. A blank on either route lands on one dedupe
  key, so `''` and `{ dialect: 'cel', source: '' }` print one line.
- `evalRowPredicate`: a bare blank string returned the caller's fallback before
  anything could say so. It now takes the route its blank-envelope twin already
  took, with the same fallback and the same report (labelled on the
  `warnOnError` route).
- `sectionFields`' `attachVisibility` (every sectioned `object-form` arm): a
  blank view-level predicate is still dropped, so the field draws with no gate,
  and the drop is reported, naming the field. A runtime field that already
  carries its own blank `visibleOn` keeps it. The form renderer reports that one
  when it evaluates it.

**Refused at authoring (`@object-ui/types`, minor, a narrowing).** The protocol
declares an option's `visibleWhen` and a form view field's `visibleWhen` /
`visibleOn` as `EvaluatedExpressionInputSchema`, which refuses a blank predicate
(since `@objectstack/spec` 17.5.0). objectui's `SelectOptionSchema.visibleWhen`
and `FormFieldSchema.visibleOn` override those keys to keep objectui's wire, and
they still accepted `''`, whitespace and a blank envelope `source`. Both now
refuse them at the key, with the protocol's own sentence, through the check the
field-rule triad already carries. The accepted shape is unchanged: the same wire
options, by reference, and the parsed value is the authored one.

`BaseSchema`'s `visible` / `hidden` / `disabled` have no protocol counterpart,
so a blank there still parses and is only diagnosed.
