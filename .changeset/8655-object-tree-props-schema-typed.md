---
'@object-ui/plugin-tree': minor
---

`ObjectTreeProps.schema` is the published `object-tree` node instead of `any`,
and `getTreeConfig`'s parameter with it (objectui#8655).

The type is DERIVED, not written out: `Extract< ObjectQLComponentSchema, { type:
'object-tree' } >`, the spelling that union's own docblock teaches. So every key
name and key type still has exactly one declaration, `ObjectTreeSchema` in
`@object-ui/types`, and a key added or retyped there arrives here without an
edit. `Extract` rather than a named import because the TS barrel does not export
`ObjectTreeSchema` — the zod barrel does, its nine siblings are all on the TS
one, and repairing that omission is a published-surface addition on another
package, so it is reported rather than smuggled in here.

Accept-set change on the published props type, stated plainly:

- NARROWS. `any` accepted everything; the node accepts what `ObjectTreeSchema`
  declares plus anything `BaseSchema`'s `[key: string]: any` admits. Breaking
  for a TypeScript consumer that passed a value the node schema refuses at a
  DECLARED key — `labelField` and `fields` are the two that can bite, since the
  renderer tolerates host column OBJECTS there while the declaration says
  `string` / `string[]`. This package's own test carried exactly that shape and
  now says so at the mount rather than compiling silently.
- No runtime behaviour changes. One `as any` is removed at a read site and one
  is deliberately kept; both are casts, neither is a value.

Why the type had to come first: the two reads this card was filed on were
reported UNANSWERABLE, not undeclared. Through `any`, `checker.getPropertyOfType`
returns `undefined` for a key the node certainly declares exactly as it does for
a nonsense token, so no verdict was available at all. Typed, the checker answers,
and the two answers point in opposite directions — `data` is DECLARED (on
`BaseSchema`), so its cast is gone; `navigation` is genuinely undeclared and its
cast stays, marking the read rather than hiding it.

What the re-measurement then surfaced, reported rather than tidied: six more
reads became answerable, five declared and one — `filter` — not. Its verdict is
declare-by-mirror-alignment and it is ⛔ NOT executed here, because the two files
that would carry it are held by an in-flight branch; the ledger row in
`ObjectTree.schemaTyped-8655.test.ts` reddens the day it lands. `tree` is
declared by the protocol on the VIEW and on zero element faces, so declaring it
on the node would fork rather than mirror the contract, and retiring the read
needs a producer census a text search cannot make. `navigation` belongs to a
blocked card and is ledgered, ⛔ not ruled.

Nothing in `@object-ui/types` is declared, widened or narrowed by this change.
