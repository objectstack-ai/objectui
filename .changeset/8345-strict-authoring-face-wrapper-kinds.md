---
'@object-ui/types': patch
---

`deriveStrictAuthoringSchema` now walks `set`, `map`, `prefault` and `promise`
— the four schema-bearing wrappers its `default:` arm used to hand back as if
they were leaves, leaving the object inside each one OPEN and reporting nothing
(objectui#8345, the follow-up the director's review owed the card). An object
inside any of them is closed like every other object on the twin, an invented
key inside it is refused with an `unrecognized_keys` issue naming it, and an
opaque node inside it is still reported through `onOpaqueShape` — the report
path passes through the wrapper instead of stopping at it. A schema-bearing kind
the walker still has no arm for is now REPORTED under its own def type rather
than swallowed (on zod 4.4.3 that is only `success`, which can never refuse).

**Nothing on the published face moves.** None of the four kinds occurs on
`AnyComponentSchema` today — the pin file counts each at 0 on the forced graph
— so `StrictAnyComponentSchema` and `StrictSchemaNodeSchema` accept and refuse
exactly what they did, and the tolerant face is untouched as ever. The only
observable change is for a caller deriving its OWN schema through
`deriveStrictAuthoringSchema`, and it is a narrowing: an undeclared key inside a
set, map, prefault or promise is refused where it used to be silently dropped.
