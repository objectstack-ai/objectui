---
'@object-ui/types': minor
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-view': minor
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

**The refusal an author now meets**, verbatim from the arms' own messages (one
string per arm feeds both the parse-time issue and the `.describe()` metadata):

```text
Unrecognized key(s) on this calendar configuration: `dateField`. Did you mean
`dateField` → `startDateField`? `dateField` and `endField` are the pre-#2231
objectui spellings of the calendar date axis, retired at both faces by
objectui#8355. `@objectstack/spec` spells the axis `startDateField` and
`endDateField` only. ⚠️ This package accepted BOTH legacy spellings green until
that retirement — they rode a `.passthrough()` straight through
`safeValidateSchema` into `ListView`'s calendar branch, which flattened them onto
the generated `object-calendar` node where the renderer's alias ladder read them.
That ladder is gone, so the key is refused here instead of being kept and then
ignored. Write `startDateField` for the event start. Kept rather than refused, an
authored `dateField` binds nothing: the calendar falls through to "Calendar
configuration required. Please specify startDateField and titleField.", a screen
that names the canonical keys and never the key you wrote.
```

⚠️ **The consequence clause is per key, because the two spellings fail
differently.** `endField` gets the same stem and this tail instead — measured on
the renderer, not assumed:

```text
…Write `endDateField` for the event end. Kept rather than refused, an authored
`endField` fails even more quietly than its sibling: a calendar that also carries
a start binding still DRAWS, and only the end of every event is silently dropped.
```

On the flat node face the surface noun is `this object-calendar node`. ⚠️ **The
element's own `calendar` container carries a different tail for `dateField`**,
because it fails differently and was measured doing so: `getCalendarConfig` reads
that container WHOLE, so a retired spelling there never reaches the refusal
screen — the calendar mounts and simply places nothing, every record landing
under "Unscheduled". `endField` keeps one clause, because it reads the same on
both.

```text
…Write `startDateField` for the event start. Kept rather than refused, an
authored `dateField` fails without even reaching that refusal screen: this
container is read WHOLE, so the calendar still mounts and simply places nothing —
every record ends up under "Unscheduled" with no date to draw it on.
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
channel that reaches an author is the validator, and it now names the key and the
remedy on all five authoring surfaces this vocabulary has: a list view's
`calendar` block and its legacy `options.calendar` twin, a named view's two
nestings under `listViews`, the flat `object-calendar` node face, and that
element's own `calendar` container. ⚠️ Stated as five surfaces rather than
"every author" on purpose: a host that builds the node in TypeScript and hands it
to `SchemaRenderer` never parses the mirror at all — `SchemaRenderer` runs the
structural core validator, which is dev-only and names no key — so the compiler
is that population's channel, not this one.

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

**The four moving parts:**

- `@object-ui/types` — `aliasKeyRefusal()` arms on the view-level `calendar`
  block, on the legacy `options.calendar` nesting (a check, since an open record
  declares no member — `custom` there, `invalid_type` at the declared slot), on
  the flat `object-calendar` node face, and on that element's own `calendar`
  container; plus a `.check()` on `ObjectViewSchema` for a named view's two
  nestings. `z.input` of each arm is `undefined`, so the TypeScript face carries
  `dateField?: never` / `endField?: never` and `tsc` refuses the key at the
  authoring site as well.
- `@object-ui/plugin-calendar` — `getCalendarConfig` reads the declared
  spellings only; the `CalendarAliasRungs` cast target and both read sites are
  gone, and the config memo's dependency list loses the two entries with them.
- `@object-ui/plugin-list` — the `calendar` branch destructures the two
  spellings out of the merged block and spreads only the remainder onto the node,
  exactly as the kanban branch strips its own stray `groupBy` (objectui#8365).
- `@object-ui/plugin-view` — **the SECOND route**, and the reason this entry
  moved four packages rather than three. `generateViewSchema` runs when no host
  supplied `renderListView` — the authored `object-view` element — so a named
  view never passes through `ListView`. Its calendar branch spread the authored
  block raw, so removing the renderer's ladder turned a document that DREW into
  one that shows "Calendar configuration required" and nothing else. Measured end
  to end before the fix was written. It now strips the two spellings like its
  sibling, and the `ObjectViewSchema` check is what makes an authored alias loud
  there instead of mute.

⚠️ **`ObjectViewSchema.listViews` stays UNMIRRORED, and this entry does not
change that.** That key waits on a maintainer decision about its VALUE TYPE —
neither the spec's strict `ObjectListViewSchema` nor the local `NamedListView`
can be the declared value without losing documented behaviour or enforcing 43
unread members. A `.check()` decides none of it: it declares no value type, puts
no key in the object's `shape`, requires no `columns`, and refuses neither an
undeclared key nor the legacy `options` bag. It judges exactly the two spellings
this entry retires, at the two nestings the producer merges — with pins on each
of those non-effects.

⛔ **Not a producer-side fold.** Normalising `dateField` to `startDateField` in
`ListView` (option A) was put to the director seat and refused as the end state:
it keeps a second spelling alive at the producer, which is the lenient alias
AGENTS.md #0.1 names. The aliased view therefore produces **no** date binding,
and the author is told why at the door instead.

⚠️ **Upstream's refusal suggests the wrong canonical key for `dateField`, and it
is a typo-distance suggester rather than a declaration.** Re-derived by running
the installed pin (`@objectstack/spec` 17.4.0), with controls in the same pass:
`CalendarConfigSchema`'s `strictObject` options carry `surface` and `history` and
no `aliases` entry, so the protocol declares nothing about either spelling. The
"Did you mean `dateField` → `endDateField`?" an author meets is a fallback
`findClosestMatches` Levenshtein suggestion budgeted `max(2, floor(len/3))`:
`endDateField` is 3 edits from `dateField` and inside its budget of 3, while
`startDateField` is 5 and outside it — and `endField`, budgeted 2, reaches
nothing, which is why it and a nonsense control key both draw no suggestion at
all. A one-character typo of the canonical key does resolve to `startDateField`,
so the suggester is working as designed; it simply has no opinion to offer about
a legacy alias.

⇒ **nothing upstream says `dateField` means the end of an event.** The hazard is
author-facing rather than contractual: someone who copies that suggestion writes
`endDateField` and binds the END of an event to the date they meant as the START,
which every layer accepts. Every objectui read site folds this spelling onto the
**start** — the retired ladder did, `normalizeListViewSchema`'s `timeline` fold
does, `resolveTimelineDateBinding` documents it as "the pre-#2231 alias for
`startDateField`", and this package has published "Deprecated alias for
startDateField" for releases. So these arms name `startDateField` and a control
pin holds that line. The remedy upstream needs is an explicit `aliases` (or
`guidance`) entry for the two spellings so the suggester never answers for them;
that is upstream's formatter, on upstream's card, and is not fixed here.

⛔ **The timeline alias is NOT retired by this change.** `timeline.dateField`
stays a live, accepted alias with live consumers (`normalizeListViewSchema` folds
it onto `startDateField`, `ObjectView` reads it, and app-shell pins that it still
renders). The card's own boundaries put the map / gantt / timeline / kanban
ladders on their own cards; a pin in `@object-ui/types` asserts the timeline
spelling still parses green, so a later sweep has to say so rather than carrying
it in silently.

**Pinned** by `calendar-date-alias-refusal-8355.test.ts` (`@object-ui/types`, all
five surfaces, the per-surface consequence split, the compile-time face, and the
structural guard that `listViews` stays out of the object's `shape`),
`ListView.calendarAliasRefused-8355.test.tsx` (`@object-ui/plugin-list`) and
`ObjectView.calendarAliasRefused-8355.test.tsx` (`@object-ui/plugin-view`) — both
reading the node their producer really emits through a spy registration, which is
the only census that can see a key arriving through a spread — and the inverted
ledger rows in `calendarUnionReads-8651.test.tsx` (`@object-ui/plugin-calendar`).
