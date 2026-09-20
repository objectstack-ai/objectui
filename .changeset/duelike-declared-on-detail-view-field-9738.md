---
'@object-ui/types': minor
---

`DetailViewField` declares `dueLike?: boolean` — the published TypeScript twin now accepts the key its own validator already judged and its own renderer already honours (objectui#9738).

Three of the four faces already agreed. `views.zod.ts#DetailViewFieldSchema` validated `dueLike` and kept it; `DetailSection` spreads the authored field into the bag `enrichDetailField` returns and hands it to the resolved cell renderer, whose `resolveDueLike` reads the key; the `date` and `datetime` documentation pages teach it. Only the twin disagreed — and because `DetailViewField` carries no index signature, it disagreed loudly: the same document the validator accepted was refused by the compiler.

    base  (edbcf1e7aa)  const f: DetailViewField = { name: 'end_date', dueLike: true }
                        -> error TS2353: 'dueLike' does not exist in type 'DetailViewField'
    head                -> compiles

So an author following the docs and the validator got a red build, and an author following the type had no way to reach a shipped capability. Maintainer ruling, letter A: declare it, so the meaning of the key is written once, in the declaration.

`Clause-②: yes` — the published type's accept set widens by exactly one key. Measured by parsing the interface, comments stripped by construction: 13 members at base, 14 at head, the difference being `dueLike`; the same instrument reads `currency` on both legs, so the base zero is a measured absence rather than a silent instrument.

Nothing else moves. The zod mirror is untouched — it already declared the key, with the `describe` text this declaration's docblock restates. The two pins move WITH the measurement rather than being repaired: the `@ts-expect-error` that recorded the refusal is replaced by the assignment it guarded plus an exact `Equal` that separates a declared member from one absorbed by an index signature, and the `MirroredUndeclared` ledger row for this pair is deleted, which is the only direction that ratchet may move in.
