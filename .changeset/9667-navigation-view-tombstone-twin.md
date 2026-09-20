---
---

Drop every authoring of the retired `navigation.view` key from this repository's
contract twins (objectui#9667). `objectstack-ai/objectstack` PR objectstack#18619
retired `NavigationConfigSchema`'s `view` slot as an ADR-0049 tombstone (director
decision batch #126 item 4) — `retiredKey()` is `z.never().optional()`, so on a
`@objectstack/spec` carrying the retirement the key is still DECLARED but its
input type collapses from `string | undefined` to `undefined`, and every authored
name becomes `TS2322: Type 'string' is not assignable to type 'undefined'`.

Four test files authored it. Each keeps its own subject, carried on a key the
spec still admits rather than weakened: the parity file's mode-less cases move to
`preventNavigation`, the gantt declared-key legs keep `mode` + `openNewTab`, the
`object-view` mirror fixture keeps `mode` + `size`, and the ListView gantt
forwarding case keeps `mode` + `size` so it still proves the whole authored block
is forwarded rather than a mode-only projection. The parity file's
`SpecDeclaredKeys` alias deliberately still lists `view`, because a tombstone
leaves the key in the object shape — DECLARED and WRITABLE are separate facts and
that alias measures the first one.

Test and comment only; no package is released by this change.

⚠️ THE TOMBSTONE PIN IS STILL OWED. The retirement's execution asks the contract
twins to assert the key is REFUSED. This repository's convention for that is an
`@ts-expect-error` directive, and it is not writable while `@object-ui/types`
resolves a `@objectstack/spec` that predates the retirement: the key still types
`string | undefined` there, the line under the directive compiles, and `tsc`
rejects the directive itself as unused (TS2578). The pin is owed on
`view-navigation-config-spec-parity.test.ts` the day this package's
`@objectstack/spec` dependency moves onto a version carrying the retirement; that
file's docblock records the same debt beside the place the pin goes.
