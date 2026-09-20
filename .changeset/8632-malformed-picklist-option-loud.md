---
'@object-ui/app-shell': minor
---

Report a malformed picklist option in the field designer instead of showing it as a
blank row and deleting it (objectui#8632).

**The half that did the damage is the deletion.** `ObjectFieldInspector`'s
`readOptions` opened with `value: String(o?.value ?? '')`, so every option entry it
could not read arrived as `value: ''` — two empty input boxes. `OptionsEditor` persists
only rows with a non-empty `value`, so those entries were then written out of the
document. Measured on `options: ['draft','open','closed']`: the list rendered as three
blank rows, and **one click on "Add value", with nothing typed, wrote `options: []`**.
An author who opened a picklist, saw an empty-looking option list, and clicked the
obvious button lost three authored options they had never been shown, with nothing on
screen attributing the loss to anything they did.

**"Malformed" was two families, not one shape.** Beyond the entries that collapsed to a
blank row (a bare string, `null`, a number, a boolean, `{}`, an option with no `value`,
an authored empty `value`, a nested array), a second family was silently **rewritten**
and never looked wrong: `{ value: 5 }` was written back as `"5"`, `{ value: ['alpha'] }`
as `"alpha"`, `{ value: { a: 1 } }` as `"[object Object]"`, a non-string `label` as
`label: ''`, and a non-string `color` was dropped from the document. Both families are
now covered by one rule.

**What changed.** The reader is now strict — the `String()` coercion is gone rather than
widened, per AGENTS.md #0.1 — and classifies each authored entry. An entry this editor
cannot represent faithfully gets a marked row of its own naming the reason, showing the
authored entry verbatim, and carrying the same reorder/remove controls as any other row;
it is written back **byte for byte as authored** on every commit. Removing it stays
available and stays deliberate.

**This narrows what the designer will save.** A document with a malformed option used to
become saveable because the designer silently deleted the offending entries; it no longer
does. The entry is preserved, so the draft keeps failing `FieldSchema` until the author
repairs or removes it — which is the reported state rather than a silent repair. The
escape path is one click on the row's Remove button, and it reproduces exactly the old
outcome with the author choosing it.

Well-formed option sets are untouched: they render and commit key for key as before,
including the `default` / `visibleWhen` carrier (objectui#7540), the `label: ''` emitted
for an option with no `label` key (objectui#7014), and the editor's own blank trailing
row, which is still filtered on commit.

Two new strings land in the designer's own `en` / `zh` tables — the metadata-admin
console owns its strings in `views/metadata-admin/i18n.ts` and is deliberately outside
the ten locale packs (`packages/i18n/README.md`, "Scope — the `engine.*` carve-out").
