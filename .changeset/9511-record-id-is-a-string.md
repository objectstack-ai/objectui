---
'@object-ui/types': minor
'@object-ui/plugin-form': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-view': minor
---

**BREAKING** — a record id is a **string** wherever metadata names one, and on the last
`DataSource` door (objectui#9511). An authored `recordId: 42` / `resourceId: 42` no longer
validates.

**FROM** `string | number` **TO** `string`, on both published faces of three authorable keys
and on `DataSource.findOne`:

```jsonc
// before — accepted
{ "type": "detail", "resourceId": 42 }
// after — refused at parse, with the repair named in the message
{ "type": "detail", "resourceId": "42" }
```

**What an author sees, in business terms.** If you write a record id as a bare number today,
your metadata stops validating the moment you upgrade, and the error tells you what to write:
quote it. `42` becomes `'42'`. ⛔ **Nothing converts for you, in either direction** — that is
deliberate, not an omission. The platform is not guessing whether your `42` meant the string
`'42'` or something else; a host whose primary keys are numeric does the conversion once, at
its own adapter boundary, so every author, every caller and every adapter downstream sees one
shape. The wire traffic for such a host was already `'42'` on `update` (objectui#9333) and on
`delete` / `bulkUpdate` / `bulkDelete` (objectui#9712); this change makes `findOne` agree
instead of being the one door that disagreed.

**The three authorable keys, each on BOTH faces.** `ObjectFormSchema.recordId`
(`objectql.ts` + `zod/objectql.zod.ts`), `DetailViewSchema.resourceId` (`views.ts` +
`zod/views.zod.ts`) and `DetailSchema.resourceId` (`crud.ts` + `zod/crud.zod.ts`). ⚠️ The
`crud` pair is **`DetailSchema`**, not `DetailViewSchema`, and it reaches the same renderer —
not by symbol but by data flow: `plugin-detail` registers the `'detail'` node type onto
`DetailView`. A read that follows TypeScript symbols alone finds two keys and is incomplete.

⭐ **The declaration alone would not have been enough, and this is the reusable part.** A
TypeScript declaration does not run at parse time. The hand-written zod mirror is the only
face in this repository that can refuse an authored number, so narrowing the declaration
without the mirror would have shipped `declared !== enforced` on a published surface — and
`zod-mirror-parity.test.ts` would have stayed GREEN through it, because that instrument
asserts a mirror accepts everything its declaration declares and a mirror left WIDER passes.
Both faces moved together for that reason.

**Disposition: an ADR-0087 D2 narrowing that ships `minor` with this banner, ⛔ not a
tombstone and ⛔ not an npm `major`.** The key stays declared and writable; only its accept
set narrows, so there is no `never` member and no `retirementTombstone()`. Pre-GA, a
metadata-facing break ships `minor` carrying the `**BREAKING**` banner and its ADR-0087
disposition — the level is not the carrier of breaking-ness during the window, the banner and
this line are (ADR-0087, amended 2026-09-13). `major` is refused outright here anyway: all
publishable packages sit in one `fixed` group pinned to the `@objectstack` major
(AGENTS.md §版本号策略, enforced by `scripts/check-changeset-no-major.mjs`).

⚠️ **No live conversion entry ships with this.** A D2 conversion table lives in
`@objectstack/spec`, and these three keys are objectui's own vocabulary rather than spec keys,
so there is no table here to add a row to; the repair is also lossless and mechanical in a way
a table would not improve (`42` to `'42'`). An author is given the prescription at the point
of refusal instead. Recorded rather than left silent, because ADR-0087's post-GA ladder does
require a live entry and this is the pre-GA spelling of the same obligation.

**The accept set moved in exactly ONE direction, measured — 45 documents across the three
mirrors, parsed on this branch and on the merge base:**

| reading | count |
| --- | --: |
| GREEN to RED | **9** — the three keys x integer / negative / float, and nothing else |
| **RED to GREEN** | **0** |
| verdict unchanged | 36 |
| refusals carrying the prescription | **9 / 9** |

Controls on the same instrument and corpus: **lit** — `title: 42` / `objectName: 42`, keys
that were string-only before this change, still refuse with `invalid_type`; a wrong `type`
literal still refuses; **green** — the key absent, `'42'`, `'rec_1'` and `''` all still parse;
**red-both (21 rows)** — object, array, boolean and `null` at the same key were refused before
and are refused now, which is the half of the corpus that shows nothing was loosened while the
number arm was removed.

**Delivery surface — where the refusal does and does not arrive.** PARSE-TIME on the mirror
(`@object-ui/types/zod`, so `objectui validate` and any consumer calling `safeParse`) and
COMPILE-TIME on the declaration (`tsc`). ⚠️ As with every other key on these mirrors, the
runtime render path does not parse through them, so a rendered document is not where this
arrives.

⚠️ **Dated note, 2026-09-25 — `objectui check` does not deliver this refusal —
objectui#10524.** This entry first listed `objectui check` on the parse-time side. `check` is
an advisory sweep: it never parses a file whose root carries a structural key (`children`,
`className`, `body`, …), it lists a file with none of those keys by name when the file does
not validate, and it exits non-zero on unreadable JSON only. The refusal is
`objectui validate`'s.

**Consequential narrowings, all compiler-forced by the door above.** `DrawerForm`,
`ModalForm`, `SplitForm`, `TabbedForm` and `WizardForm` each declare their own `recordId` and
hand it straight to `findOne`; `ObjectForm` builds all five from the authorable
`ObjectFormSchema`, so they move together or the refusal simply relocates onto the hand-off
site. Two more fell out of the same narrowing and are named because they are NOT obvious:

- `@object-ui/plugin-grid` — `BulkActionDialogProps.dataSource` hand-restates `findOne`. It
  declares it as a **property**, not a method, so it is checked contravariantly where the
  interface's own method declarations are bivariant. ⇒ this is the one shape in the tree where
  narrowing the protocol reddens a consumer rather than passing it by, and that file's own
  comment had already predicted it.
- `@object-ui/plugin-view` — `ObjectView.buildFormSchema` asserted an untyped record bag's id
  as `string | number | undefined`. The assertion now states the protocol. ⛔ Deliberately not
  `String(...)`: a reader-side coercion is the option the ruling refused.

**Ruling.** Director batch #195 item 1, letter **A**, maintainer 「同意」 2026-09-20, standing
on batch #136 item 5 letter **B**. **B** (leave the fifth door wide and document the asymmetry
as deliberate) and **C** (convert at each reader) were both refused — C by name, because eight
conversion sites contradict the rule's own aim that the conversion live in one typed place.

**Pins.** `data-source-id-surface-9511.test.ts` gains the `findOne` rows it previously and
deliberately withheld, plus an absence row so the retired "this door is held open" prose
cannot return. `authorable-record-id-string-9511.test.ts` is new and pins the parse half —
the refusal, its prescription, the string spellings, and both control directions.

⚠️ **The ruling's execution note asks for the `KnownDrift` / mirror-parity ledger rows to
shrink in the same change; that is an instruction over an EMPTY SET.** Measured in
`zod-mirror-parity.test.ts`: `resourceId` appears **0** times and `recordId` **1**, and that
one hit is prose about an `onNavigate` signature rather than a ledger row. There is nothing to
shrink, and it is said here so the next reader does not go looking for rows that never existed.
