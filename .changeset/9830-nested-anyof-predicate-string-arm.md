---
'@object-ui/app-shell': patch
---

A metadata predicate whose string arm sits one `anyOf` deeper reaches the
condition builder (objectui#9830).

`SchemaForm`'s five name-convention detectors each gated on the same inline
expression — `schema.type === 'string' || schema.anyOf.some(b => b.type ===
'string')`. That scan is ONE level deep, and the platform serves a predicate
that also accepts a boolean literal as a union inside a union. Derived from the
installed `@objectstack/spec` through the same `z.toJSONSchema` call
`/meta/types` is served with, `action`'s own `visible` is:

```
anyOf: [ { type: 'boolean' },
         { anyOf: [ { type: 'string', minLength: 1 }, { …dialect/source envelope } ] } ]
```

The string arm is there; the one-level scan returned false for it, so
`detectConditionWidget` declined a key it was written to claim. The same type's
`params[].visible` carries its string arm at the TOP level and was routed all
along — one product, one key name, two nesting depths, two different faces. The
runtime on those keys fails CLOSE on an unevaluable predicate, so the author got
a plain text box, no builder and no lint for an expression the platform will
refuse at evaluation time.

The gate is now one named function, `admitsString`, that all five detectors call.
It walks `anyOf` and `oneOf` together, because `pickBranch` and the scalar chain
already read `schema.oneOf ?? schema.anyOf` as one union and a detector that
disagreed with the branch picker about what a union is would reopen the same
split one combinator over. `allOf` is deliberately not walked — it is an
intersection.

**Measured over the 30 metadata types the installed spec resolves a schema for**,
by walking every derived property row structurally rather than by matching text:
in the OUTPUT derivation the gate's answer changes on **0** rows; in the
authoring (`io: 'input'`) derivation it changes on exactly **4**, all
predicate-named — `action.visible`, `action.disabled` and the same pair inside
`object.actions[]`. `action` is one of the two types whose output derivation is
degenerate, so it is the type served from the authoring retry arm. For the other
four detectors — field-ref, secret, icon, colour — the answer changes on **0**
rows in BOTH derivations, so lifting the gate out whole is a no-op for them
today; it is done that way rather than as a fifth inline copy so the next
detector is not left holding the old scan.

**⛔ What this deliberately does not change.** An empty schema (`{}`) is still
not read as a string arm. `hook.condition`, `sharing_rule.condition` and
`field.visibleWhen` / `readonlyWhen` / `requiredWhen` derive `anyOf: [ {},
{ …envelope } ]` in the output mode — the transform on those keys erases its own
input type. JSON Schema says `{}` admits everything, strings included, but it is
also exactly what "we could not derive this" looks like on the wire, and reading
it as a string arm would mount a CEL builder on any predicate-named key that
derived to nothing, including a genuinely boolean-only one. Telling those two
apart needs a signal only the declaration side can send, so that half of
objectui#9830 is reported rather than guessed, and the pin test asserts the husk
still gets no builder.
