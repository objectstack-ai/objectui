---
'@object-ui/types': minor
'@object-ui/components': patch
---

`UIActionSchema` declares the four keys the two action renderers were reading
through `as any` — `disabled`, `recordIdField`, `resultDialog`, `undoable`
(objectui#8648, the objectui#8327 family's `components` card).

**Four keys, four separate readings, and the contract gave the same answer four
times.** The exit per key is settled by one question — does `@objectstack/spec`
declare this key, and on WHICH schema? — because `@object-ui/types` is a MIRROR
of the platform contract and not an authority over it. All four came back
DECLARED on the contract's own `ActionSchema`, which is the schema
`UIActionSchema` mirrors and the one both renderers annotate `schema` with. ⇒
ALIGN THE MIRROR, four times. ⛔ Not one answer forced onto four keys: the
census asks once per key and its inline sibling is where the same question comes
back *no*.

Every verdict came from `checker.getPropertyOfType` on the static type of
`schema` BEFORE the cast, never from a grep (objectui#8410 is the standing card
that grep-shaped absence claims are unsound). ⭐ `disabled` is the one worth
naming: a word-frequency screen over the UI contract answers "present" for it
loudly, and that reading decides nothing — the contract also declares `disabled`
on surfaces these renderers have nothing to do with, and refuses it on its own
inline action schema. The per-schema reading is what separates those, and it is
re-derived on every run rather than written down
(`packages/components/src/renderers/action/__tests__/action-undeclared-keys-8648.test.ts`).

**This is an alignment, not a widening past the contract.** The accept set of
this face moves to the platform's and never beyond it: a document that was
already valid everywhere else stops being refused here with `TS2353`. Nothing
that worked stops working. `disabled` inherits all three arms the contract
accepts — literal boolean, raw CEL string, and a `{ dialect, source }` envelope
— by derivation rather than by hand, so it cannot drift; `@object-ui/core`'s
`ActionDef` has derived the same key from the same spec type all along, and this
is the READ side of that pair, which had no declaration to land in.

**No runtime behaviour changes.** All eight read sites were already honoured;
what changes is that the compiler now checks them. ⚠️ And declaring a key is
not enough on its own — a cast at the read site defeats the declaration while a
membership instrument still reports the member as present, so the casts are
removed in the same change and the pin goes red if one returns.

**A second defect the `as any` was hiding, named here and filed rather than
fixed.** Removing the read-side cast on `resultDialog` made the compiler report
that `@object-ui/core`'s `ResultDialogSpec` — whose own docblock claims it
mirrors the contract's block — hand-writes `title` / `description` /
`acknowledge` as `string` where the contract declares `I18nLabel`. One `as any`
was hiding two defects at once: a missing declaration on the read side and a
drifted type on the write side. The repair lands in `@object-ui/core` plus the
dialog's own resolver and turns on an i18n-resolution decision, so it is filed
as objectui#9542 and ⛔ not guessed at here. Meanwhile the WRITE carries a
narrowing assertion to `ActionDef['resultDialog']` at both forward sites —
strictly narrower than the `as any` it replaces, since every other member of the
forward literal is compiler-checked again — documented as a ledger entry and
pinned so it cannot regress to `as any` and cannot outlive its cause in silence.
