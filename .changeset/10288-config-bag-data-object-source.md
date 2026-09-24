---
'@object-ui/react': minor
---

fix(react): a data object in a node's `properties` / `props` bag reaches the renderer whole, even when it carries a `source` field

`SchemaRenderer` evaluates each value of a node's config bag (`properties`, and its legacy alias `props`) one by one, and handed every value to `ExpressionEvaluator.evaluate`. That call unwraps ANY object with a string `source` to that bare string before it does anything else. So an authored data object that merely had a field called `source` was silently replaced by that one string: an `action:button` with `properties.bodyExtra: { source: 'web', campaign: 'spring' }` sent `"web"` to the action runner instead of the object, with no error and no warning. The same object written at node level, which no loop visits, always arrived intact.

This was never one key's problem. Every object-valued input on those two bags took the same path, including values keyed by field name: form `defaultValues` / `initialValues`, a declarative `patch`, filter `values` and a detail view's `data`, where a field named `source` is ordinary.

On a key outside the predicate chain, an object now reaches `evaluate` only when it is an Expression envelope in `@objectstack/spec`'s sense, meaning it carries a string `dialect` (the spec's `ExpressionSchema` requires one). Every other object is handed to the renderer exactly as authored.

**Behaviour change, stated plainly.** The only value whose meaning changes is an object on a non-predicate config-bag key that has a string `source` and no string `dialect`. It used to collapse to its evaluated `source`; it now arrives as the object. Everything else evaluates as before:

- strings are still interpolated;
- a `{ dialect: 'template', source: '${…}' }` envelope still resolves to its value;
- the predicate keys (`visible`, `visibleWhen`, `visibleOn`, `visibility`, `hidden`, `hiddenOn`, `disabled`, `disabledOn`, `enabled`) are unchanged: a CEL envelope is still preserved for the canonical engine (objectui#9100 / #9107), and a dialect-less `{ source }` on them is still evaluated, the form `ExpressionWire` declares for `visible` / `hidden` / `disabled`;
- `params` is still walked leaf by leaf (objectui#7867).

Declared as a minor (Clause-②): nothing in the published API is added or removed, but what an authored value evaluates to changes for one shape. `ExpressionEvaluator.evaluate`'s signature admits a dialect-less `{ source }`, and these loops handed it every value except a `params` bag and a CEL envelope on a predicate key. So `{ source: '${…}' }` on a config-bag key outside the predicate chain and `params` now arrives as the object, uninterpolated, and the unevaluated-expression diagnostic does not report the `${…}` inside it. To keep such a value evaluated, write the bare string `'${…}'` or `{ dialect: 'template', source: '${…}' }`; both still interpolate on that path. The spec's envelope always carries `dialect`, and `@object-ui/core`'s `isRuntimeDefault` already reads a dialect-less `{ source }` as a literal value.
