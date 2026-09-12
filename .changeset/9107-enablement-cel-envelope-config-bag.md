---
'@object-ui/react': minor
---

fix(react): keep the CEL predicate envelope intact on the ENABLEMENT keys too

`SchemaRenderer`'s two per-value config-bag loops (`properties` — the spec
spelling — and its legacy `props` alias) flattened a `{ dialect: 'cel', source }`
predicate envelope on `disabled` / `disabledOn` / `enabled` down to its bare
`source` string, exactly as objectui#9100 measured for the visibility chain. The
envelope is the only thing that routes `evaluateCondition` to the canonical
`@objectstack/formula` engine, so the flattened predicate took the legacy JS
path, where a CEL stdlib call such as `has()` is not a function.

objectui#9104 repaired this for the six visibility legs only. The enablement
keys are not visibility legs — they route through the node's enablement gate and
through the action renderers' own predicate call — so they were left flattened,
and the resulting fail-soft `true` landed in OPPOSITE directions on the two
halves of the chain:

- `disabled` / `disabledOn` are not negated, so a CEL-authored gate greyed its
  control out on every row and no predicate the author could write re-enabled
  it — measured through `action:button` and `action:icon`;
- the legacy `enabled` alias IS negated by those renderers, so the same `true`
  arrived as "not disabled" and a control the author had disabled stayed
  pressable.

The guard now consults the union of the file's two closed predicate-chain
declarations instead of the visibility one alone. `template` and dialect-less
envelopes, non-predicate bag keys and predicates nested inside arrays keep their
behaviour byte for byte.
