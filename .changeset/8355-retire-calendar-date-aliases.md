---
'@object-ui/types': minor
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-list': minor
---

**BREAKING** — the calendar date aliases `dateField` and `endField` are retired
at both faces (objectui#8355). They are now **declared refusals**: an authored
value is rejected **by name**, at its own key path, pointed at `startDateField` /
`endDateField`.

**FROM** `calendar: { dateField, endField }` — accepted in silence, read by
`ObjectCalendar`'s alias ladder — **TO** a by-name refusal at validation, with
`startDateField` / `endDateField` as the only spellings that bind the axis.

```ts
// before — parsed green, drew a calendar
{ type: 'list-view', objectName: 'task', calendar: { dateField: 'kickoff', endField: 'wrapup' } }
// after  — refused at validation, naming the canonical keys
{ type: 'list-view', objectName: 'task', calendar: { startDateField: 'kickoff', endDateField: 'wrapup' } }
```

**The refusal an author now meets**, verbatim from the arm's own message (one
string feeds both the parse-time issue and the `.describe()` metadata):

```text
Unrecognized key(s) on this calendar configuration: `dateField`. Did you mean
`dateField` → `startDateField`? `dateField` and `endField` are the pre-#2231
objectui spellings of the calendar date axis, retired at both faces by
objectui#8355. …Write `startDateField` for the event start and `endDateField`
for the event end. …
```

**ADR-0087 disposition — D2 tombstone, no conversion entry and no migration
prescription.** The keys stay DECLARED and unwritable rather than being deleted,
which is the whole of the ruling: every calendar block here ends `.passthrough()`
and `BaseSchema` does too, so a deleted key is not refused — it is KEPT
unexamined and then ignored. Nothing in `@objectstack/spec` converts these two
(the protocol never declared either: `CalendarConfigSchema` is a strict object of
`startDateField` / `endDateField` / `titleField` / `colorField`, measured on the
installed pin 17.4.0 with a nonsense-key control on the same call), so there is
no ledger entry to register and no `objectstack migrate meta` step to ship. The
channel that reaches every affected author is the validator, and it now names the
key and the remedy.

⚠️ **Why this is `minor` and not `major`.** This repository forbids `major` in a
changeset: the fixed release group's major tracks `@objectstack`'s, so any
`major` here would push all of it off that cadence
(`scripts/check-changeset-no-major.mjs` enforces it). objectui's own breaking
changes ship as `minor` with the break spelled out, which is what this entry is.

**What broke silently before, and why the two halves ship together.** An earlier
attempt removed the renderer's alias ladder on its own. The producer kept
spreading the authored block flat onto the generated `object-calendar` node, so
the alias still arrived, nothing read it, and the author met a generic "Calendar
configuration required" screen naming keys they had not written. A live authoring
path stopped rendering with every gate green (recorded on objectui#8651). The
refusal at the declaration is what turns that silence into a loud, by-name
failure — so the ladder removal, the producer strip and the tombstones are one
change and must stay one.

**The three moving parts:**

- `@object-ui/types` — `aliasKeyRefusal()` arms on the view-level `calendar`
  block, on the legacy `options.calendar` nesting (a check, since an open record
  declares no member — `custom` there, `invalid_type` at the declared slot, one
  shared message), on the flat `object-calendar` node face, and on that element's
  own `calendar` container. `z.input` of each arm is `undefined`, so the
  TypeScript face carries `dateField?: never` / `endField?: never` and `tsc`
  refuses the key at the authoring site as well.
- `@object-ui/plugin-calendar` — `getCalendarConfig` reads the declared
  spellings only; the `CalendarAliasRungs` cast target and both read sites are
  gone, and the config memo's dependency list loses the two entries with them.
- `@object-ui/plugin-list` — the `calendar` branch destructures the two
  spellings out of the merged block and spreads only the remainder onto the node,
  exactly as the kanban branch strips its own stray `groupBy` (objectui#8365).

⛔ **Not a producer-side fold.** Normalising `dateField` to `startDateField` in
`ListView` (option A) was put to the director seat and refused as the end state:
it keeps a second spelling alive at the producer, which is the lenient alias
AGENTS.md #0.1 names. The aliased view therefore produces **no** date binding,
and the author is told why at the door instead.

⚠️ **The canonical target is objectui's, and upstream's alias table disagrees.**
Measured on the installed pin (`@objectstack/spec` 17.4.0) with controls in the
same pass: `CalendarConfigSchema` answers an authored `dateField` with "Did you
mean `dateField` → `endDateField`?", and answers `endField` and a nonsense
control key with the same `unrecognized_keys` diagnostic carrying no alias hint
at all. Every objectui read site folds the spelling onto the **start** — the
retired ladder did, `normalizeListViewSchema`'s `timeline` fold does,
`resolveTimelineDateBinding` documents it as "the pre-#2231 alias for
`startDateField`", and this package has published "Deprecated alias for
startDateField" for releases. Answering an author with `endDateField` would
silently re-bind their axis, so these arms name `startDateField`. The divergence
is stated at the declaration and pinned as a control, not fixed here — it is
upstream's table and needs upstream's card.

⛔ **The timeline alias is NOT retired by this change.** `timeline.dateField`
stays a live, accepted alias with live consumers (`normalizeListViewSchema` folds
it onto `startDateField`, `ObjectView` reads it, and app-shell pins that it still
renders). The card's own boundaries put the map / gantt / timeline / kanban
ladders on their own cards; a pin in `@object-ui/types` asserts the timeline
spelling still parses green, so a later sweep has to say so rather than carrying
it in silently.

**Pinned** by `calendar-date-alias-refusal-8355.test.ts` (`@object-ui/types`, all
four surfaces plus the compile-time face), `ListView.calendarAliasRefused-8355.test.tsx`
(`@object-ui/plugin-list`, the generated node through a spy registration — the
only census that can see a key arriving through a spread) and the inverted ledger
rows in `calendarUnionReads-8651.test.tsx` (`@object-ui/plugin-calendar`).
