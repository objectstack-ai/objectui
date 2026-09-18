---
'@object-ui/app-shell': patch
---

The Validations panel writes a `conditional` rule's guard under `when`, the key
the spec accepts — it wrote `condition`, which that shape refuses by name
(objectui#9802).

**The defect.** `ObjectValidationsPanel` seeds every rule type with a skeleton,
and its own docblock promises those skeletons are valid "so the immediate
object-draft save never 422s". For the `conditional` type that was false from the
start. Measured against the `@objectstack/spec` this repo resolves:
`ConditionalValidationSchema` spells the guard `when` and rejects `condition`
with an `unrecognized_keys` issue whose message suggests exactly that rename, so
adding a conditional rule from the no-code panel produced a draft the object gate
refuses — on the one path whose stated purpose is that it cannot.

**Both spellings are live; this is not a rename.** `script` and `cross_field`
carry `condition` and `ScriptValidationSchema` refuses `when` symmetrically. The
panel builds ONE CEL editor element and shares it across all three of those
types, so the key is now resolved per rule through a `guardKey` helper rather
than baked in. A blanket rename in either direction would have broken the other
types.

**What changed.**

- The `conditional` skeleton seeds `when`. Its nested `then` branch is a `script`
  rule, so that branch's own guard stays `condition`.
- The shared editor reads and writes the guard under the selected rule's key.
  Reading through the wrong one also meant a conditional rule authored anywhere
  else — the JSON source editor, a package import, AI authoring — opened in this
  panel with a blank guard, because its `when` was not the key being read.
- Switching a rule's type carries the guard across the two spellings in both
  directions, instead of carrying `condition` onto a shape that refuses it.

**Why nothing went red.** The promise was prose about a foreign schema with no
instrument behind it, and the panel's existing tests asserted its emitted keys
against the panel's own idea of them — a producer checked against itself stays
green however it spells things. The new `whenKeyPin` closes that: it drives the
real panel and runs what it emits through the spec's own `ValidationRuleSchema`
and `ObjectSchema`, for every rule type the New menu offers, so a skeleton that
would 422 fails the suite instead of shipping.

**Not addressed here.** Whether the panel should surface the spec's suggestion
text to the author is untouched. No read-side alias for `condition` was added:
a `conditional` rule carrying that key is refused by the same `ObjectSchema`
parse the draft save applies, so it could not have been persisted through that
gate in the first place.
