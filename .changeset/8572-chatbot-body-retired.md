---
'@object-ui/types': minor
---

**BREAKING** — `ChatbotSchema` no longer accepts `body`, on either published face
(objectui#8572). The chat API's body params are authored as `requestBody`, which is what
the renderer has always read.

**FROM** `body?: Record<string, unknown>` on the zod mirror ("Additional API body params")
**TO** a refusal by name. On the TypeScript face the key was never the record: it arrived
from `BaseSchema` as the content slot, and it is now `?: never` there, so `tsc` says the
same thing the mirror says.

```ts
// before
{ type: 'chatbot', messages: [], body: { model: 'gpt-4', temperature: 0.2 } }
// after
{ type: 'chatbot', messages: [], requestBody: { model: 'gpt-4', temperature: 0.2 } }
```

Executes the maintainer ruling recorded on objectui#8572 (decision batch #137, item 4,
2026-09-15, verbatim 「同意」), letter **A**. **B** — keep the record and write it into the
contract — was refused; **C** — narrow `body` back to the node slot — was refused because
`chatbot` reads NEITHER content channel, so a node-slot `body` would be legal and inert.
The governing precedent is objectui#9256 / ADR-0049, the `children` tombstone on this same
node, whose reason sentence already named `body` as equally unread.

**Disposition: an ADR-0087 D2 tombstone, not a deletion.** The key stays declared and
unwritable — `?: never` on the interface, `retirementTombstone()` on the zod mirror — so an
author gets `invalid_type` at `body` carrying the prescription, not a bare
`unrecognized_keys` and not silence. Deleting the arm would have been the silent route:
`BaseSchema` carries `[key: string]: any` and its mirror ends `.passthrough()`, so a dropped
member is KEPT rather than refused, which trades one no-op for another.

**Why this key and not another.** It was the ONE place in this vocabulary where `body` did
not mean "what goes inside this component": `zod-mirror-parity.test.ts` carried the pair
under `KnownDrift` as "two different meanings of one key", and the same collision was the
whole reason `chatbot` was the single arm of the component union whose output was not
assignable to `SchemaNode`. Both ledger rows move with this change, and the two pins that
recorded the old state are INVERTED rather than deleted (see below).

**Delivery surface, measured — this is where the refusal does and does not arrive.** The
refusal is PARSE-TIME on the mirror and COMPILE-TIME on the declaration. Run against the
BUILT artifacts (`@object-ui/cli` and its dependency closure built from this branch, so the
`dist` bytes a consumer installs):

```
objectui validate <root chatbot with body: { model, temperature }>
  exit 1 · Path: body · Code: invalid_type · message names `requestBody`   <- SUBJECT
objectui validate <the same document spelled requestBody>
  exit 0 · "Schema is valid!"                                              <- LIT CONTROL
objectui validate <the same chatbot inside card.body[]>
  exit 1 · refused through the node union                                  <- DEPTH
```

⚠️ **A consumer path DOES skip the root parse, and it is the one authors hit most.** The
runtime render path never parses through these mirrors: `SchemaRenderer` validates in dev
builds only, through `@object-ui/core`'s hand-written `validateSchema`, which knows base
keys and recursion and no per-component key at all. Measured on the same document, rendered:

```
chatbot + body: { model: 'gpt-4' }   console.warn "schema.children.type: type is required"
chatbot + requestBody                (no warning)                          <- LIT CONTROL
chatbot, neither key                 (no warning)                          <- LIT CONTROL
card + body: [{ label: 'x' }]        console.warn "schema.children[0].type: type is required"
                                                                           <- FIRING CONTROL
```

That warning is NOT this retirement arriving. It is the generic child walker mistaking the
API params for a child node — it names `children` for a key the author spelled `body`, and
it prescribes adding a `type` to the params. It says the same thing before and after this
change, and in a production build it is not emitted at all. The VS Code extension's
validator is the same shape: its own walker, no mirror. ⇒ the retirement is delivered where
documents are AUTHORED and CHECKED (`tsc`, `objectui validate`, `objectui check`, and any
consumer that calls `safeValidateSchema`), and ⛔ not where they are RENDERED. Making the
render path agree is a different change on a different package and is not made here.

**Nothing that rendered stops rendering.** No renderer read consumes `body` for this node:
the `chatbot` registration spells the chat runtime's `body` option off `requestBody`, and
`SchemaRenderer` strips both content keys out of the props bag it spreads. An authored
`body` drew nothing before this change and draws nothing after it — it is refused first
instead of dropped silently, on the two faces that refuse anything.

**Migration, in this repository: no authored document changed.** Every tracked file carrying
a `chatbot` node is in `examples/schema-catalog/src/schemas/plugin-chatbot/`, and parsing all
three and reading their key sets structurally (rather than grepping a name that also appears
in comments) finds `body` in none of them and `requestBody` in none of them, against
`messages` present in all three as the control that the reader can see keys at all.

⚠️ This repository's census cannot see a consumer outside it that authored the key. Such a
consumer gets `invalid_type` at `body` with the replacement spelled in the message, or a
compile error naming the member — which is why the FROM/TO is written out above.

`minor` rather than `major` for the reason this repo's version policy gives: `major` is
forbidden in any changeset here (41 packages in one `fixed` group), and `minor` plus an
explicit breaking note is the spelling for a breaking change.

**Pins moved, and how.** `node-recursion-point-8344.test.ts` keeps both directions and
inverts the two the ruling names: the root case now asserts the refusal (with the issue path,
the code and the named replacement) instead of acceptance, and the
`ArmsNotAssignableToSchemaNode` type pin now reads `never` instead of `'chatbot'`. ⚠️ That
type alias needed an empty-set guard, measured rather than assumed: its bare projection
`Exclude< … > extends { type: infer K } ? K : never` resolves to `unknown`, not `never`, when
the exclusion set is empty, so the naive inversion could only ever be red.
`zod-mirror-parity.test.ts` loses `body` from `ChatbotSchema`'s `KnownDrift` row (the entry
survives on its two runtime slots) and loses the whole `WiderThanDeclared` entry, with the
header figures re-derived from the ledgers by that file's own pins.

**Two pending changesets in this release were amended, prose only.**
`8344-node-recursion-point-redirect.md` said the root document was "accepted at the root
before and after" and that "the published `ChatbotSchema` is untouched"; both halves sat in
one paragraph and both are falsified by this entry, so that paragraph now carries an AMENDED
note naming this card. `9256-content-channel-family-d.md` recorded this key as "a naming
collision awaiting a ruling" and now records that the ruling landed for one of the three
chatbot faces. A third — `7655-chatbot-registration-authoring-faces.md` — says the twins
"do not copy `ChatbotSchema`'s `body` naming collision"; that sentence's claim about the
TWINS is still true and is left alone, and the collision it names is the one retired here.
