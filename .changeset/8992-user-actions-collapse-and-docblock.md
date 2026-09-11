---
'@object-ui/types': minor
---

Collapse the now-redundant `UserActionsSchema` extension, and correct a docblock that
told authors an undeclared `userActions` key is silently dropped when it is refused by
name (objectui#8992).

⚠️ **Breaking, in the producer direction, which is why this is `minor` and not `patch`**
(objectui's own breaking changes ship as `minor` with the break spelled out — AGENTS.md,
"changeset 里不要声明 `major`"). On the published `@object-ui/types` face,
`userActions.group` / `.hideFields` / `.rowColor` move from `z.ZodOptional[z.ZodBoolean]`
to `z.ZodDefault[z.ZodBoolean]` in the emitted `.d.ts`, so `z.output` for those three
goes from `boolean | undefined` to `boolean` — the key becomes REQUIRED on the output
type. Measured with `tsc`: a value typed as the old output is **not** assignable to the
new one (the three read as missing); the reverse direction is fine. **Readers of parsed
output are unaffected; code that CONSTRUCTS an output-typed `userActions` value must add
the three keys or widen its annotation.** ⛔ Nothing about what parses changes — see the
equivalence measurement below. Precedent for the same operation on the same file:
`ListColumnSchema`'s local `.extend()` collapsed into a plain by-reference re-export and
shipped under 17.1.0 **Minor Changes**.

`objectql.zod.ts`'s `UserActionsSchema` read
`stripImportedDefaults(Spec).extend({ group, hideFields, rowColor })`, an extension that
existed only because `@objectstack/spec` did not declare those three keys while
`normalizeListViewSchema` folded objectui's legacy `showGroup` / `showHideFields` /
`showColor` onto them. The protocol adopted all three in 17.3.0 (objectui#5435's
ruling), so the extension is now a second local copy of a protocol declaration — the
shape two faces start drifting from — and it collapses into the plain by-reference
re-export its own note always said it would become.

⭐ The urgent half is the docblock. It stated that `UserActionsConfigSchema` "is NOT
`.strict()`, so ... an author writing `userActions: { group: false }` had it silently
stripped — valid on parse, no effect at render". Measured against the published
artifacts of 17.0.0, 17.2.0, 17.3.0 and the resolved 17.4.0, every one of them REFUSES
an undeclared key and NAMES it (`unrecognized_keys`, one issue). A comment promising
silent tolerance in front of a loud-rejection runtime points an author — human or AI —
at a config that will fail the save gate while telling them that outcome is impossible.
`__tests__/user-actions-mirror-8992.test.ts` now pins the refusal, with firing controls
in both directions, so the sentence cannot rot back.

The accept set does not move: extended and collapsed were parsed side by side over a
33-document corpus (every declared key in both polarities, the full block, undeclared
keys, wrong types, non-objects) with an identical result — same success, same parsed
output, same refusal codes, keys and messages — and a sentinel proving the comparison
can see a difference when one exists.

⚠️ TWO THINGS ON THE PUBLISHED SURFACE MOVE, both confined to those three keys, and
both measured by rebuilding `packages/types/dist` on each side of the change:

1. They end up carrying no `.describe()` metadata. ⛔ Not because the protocol leaves
   them undescribed — it describes all three (`group`: "Allow users to change record
   grouping from the toolbar. …", and likewise `hideFields` / `rowColor` in the 17.3.0
   and 17.4.0 tarballs). The cause is objectui's own import boundary:
   `stripImportedDefaults` unwraps each `ZodDefault` with `.removeDefault()` and
   re-optionalises the inner node, and the description sits on the OUTER node it
   discards. Measured on this object: all ten defaulted keys read
   `description = undefined` after the strip, on both sides of this change, while
   `buttons` — the one member that never carried a default — keeps its description
   through it. So the three simply stop being an exception: before, the local extension
   supplied descriptions the other seven defaulted keys did not have. Nothing in this
   repository reads them.
2. In the emitted `objectql.zod.d.ts` the three move from `z.ZodOptional[z.ZodBoolean]`
   to `z.ZodDefault[z.ZodBoolean]` — the spec's own declaration, as the compiler sees it
   before the runtime strip. This is the import boundary's DELIBERATE and ruled property
   — `stripImportedDefaults` is typed `T` in, `T` out, because stripping is "a property
   of the PARSE, not of the declaration" (decision batch #90) — and it is what SEVEN of
   the other eight keys on this same object have declared all along (`sort`, `search`,
   `filter`, `refresh`, `rowHeight`, `addRecordForm`, `editInline`; `buttons` is
   `z.ZodOptional[z.ZodArray[z.ZodString]]` and never declared a default). The extension
   was making three keys the odd ones out of an object whose eleven members behave
   identically at runtime; the collapse makes the declaration uniform. ⛔ It does not
   change what parses: an omitted key is still absent from the parsed output, measured,
   on all eleven.

The emitted declaration also carries `z.core.$strict` on BOTH sides of this change,
which is the compiler restating in objectui's own published artifact what the corrected
docblock now says in prose.
