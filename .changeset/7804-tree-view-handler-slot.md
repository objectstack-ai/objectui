---
'@object-ui/types': minor
---

Declare the one handler key the `'tree-view'` renderer reads (objectui#7804, the
`TreeViewSchema` slice).

The zod arm `type: 'tree-view'` selects now declares `onNodeClick` as an
objectui#6124 RUNTIME SLOT: a named refusal on the JSON face, a callable twin on
the TypeScript face.

**Breaking, and measured.** `BaseSchema` ends `.passthrough()`, so a key an arm
does not declare is not refused — it stops being judged and the value is KEPT.
Measured on the unmodified arm: `{ "type": "tree-view", "nodes": [],
"onNodeClick": { "action": "toast" } }` parsed GREEN with the object surviving
into the parsed output, while the registered `tree-view` renderer went on gating
on `if (schema.onNodeClick)` and calling `schema.onNodeClick(node)` — a call site
that expects a function, handed a plain object. Authoring the key is now refused
BY NAME with the objectui#6124 guidance, which points at the node-type spelling
(`{ "type": "toast" }`, an `action:button` node) instead.

**`'runtime-slot'` and not `'retired'`, measured at this key's own channel.**
`'retired'` publishes *"no renderer reads this key, so nothing could ever run
it"* — true of the two siblings already tombstoned on this arm
(`onSelectChange`, `onExpandChange`) and flatly false here, since the read is
live and INVOKED. ⚠️ No in-repo host builds a `tree-view` node carrying the key:
the channel is wired end to end and only the supplier is absent, which is the
same shape as `ObjectFormSchema.onStepChange` in this card's `objectql.ts` slice
and is not evidence of a dead read. The TypeScript declaration is unchanged and
still callable, so a programmatic host supplies it exactly as before.

**Authored-document census, with lit controls — every figure a reading at this
branch's base (`0b7be13`), ⛔ not a standing claim about any later tree.** No
document in this repository authors the key: `"onNodeClick"` read 0 files over all
2630 tracked `.json` / `.md` / `.mdx` / `.yml` / `.yaml` files and 0 over the 275
tracked `apps/` + `examples/` TypeScript sources, while the controls fired on the
same corpora in the same pass (`"nodes"` 8 files, `"tree-view"` 9; and 31 / 4 on
the TypeScript half).

⚠️ **That quoted-key figure has already moved, by this branch's own hand.** At the
branch head the same query reads **2**, and both hits are RELEASE NOTES quoting the
refused example in prose — this note and `6150-undeclared-but-consumed-keys.md`.
⛔ Neither is an authored document, so the lead claim is untouched; the digit is
dated because a release note is itself a file the corpus counts. The TypeScript
half still reads 0 at the head.

Per this repository's fixed-version-group rule a `major` is not available, so the
narrowing ships `minor` with the break spelled out here.

The pair moves from `zod-mirror-parity.test.ts`'s `RuntimeOnlyDeclared` to its
`KnownDrift`, which empties the former of the one entry the latter did not also
hold — so the two unmirrored ledgers are now in a containment relation, and the
cross-ledger figure that recorded their difference states the containment
instead.
