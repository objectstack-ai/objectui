---
'@object-ui/fields': minor
'@object-ui/types': minor
---

A `datetime` cell now honours the authored `dueLike` key its `date` sibling already honoured (objectui#8958).

`DetailViewFieldSchema.dueLike` declares itself, in the `describe` text an author reads,
as marking "a date/datetime field as due/deadline-semantic, gating the relative
'Overdue Nd' wording". Both types. `DateTimeCellRenderer` never read the key, so an
author who marked a `datetime` column `dueLike` published successfully and the
affordance silently did not appear. Measured before anything was changed — clock pinned
to `2026-09-09T12:00:00.000Z`, `TZ=UTC`, `en-US`, value `2026-09-06T09:30:00.000Z`:

    date     dueLike: true  ->  "Overdue 3d"   tabular-nums text-red-600
    datetime dueLike: true  ->  "3 days ago"   tabular-nums text-sm whitespace-nowrap
    datetime  no key        ->  "3 days ago"   tabular-nums text-sm whitespace-nowrap

The last two rows were byte-identical: the authored key changed nothing, and the cell
still looked like a legitimate relative date, so the drop was invisible to a reader.
After this change the `datetime` row reads `"Overdue 3d"` with the red styling, matching
its `date` sibling on the same instant.

Both halves of the affordance travel, because the affordance is both: the "Overdue Nd"
wording (which also reaches the i18n translate fn, so a zh session no longer reads
`Overdue 3d` beside a translated date cell) and the red styling, which is applied
whichever display face the cell paints — gating it on the relative face alone would
leave `compact`, this cell's default face, still disagreeing with its `date` sibling.

Two populations change appearance, and the second is the larger one:

- `datetime` fields with `dueLike: true` authored explicitly;
- `datetime` fields whose NAME matches the due/deadline convention (`due_*`, `deadline`,
  `expires_at`, `expiry`, `expected_close`, `target_close`, `sla*`, `return_by`,
  `renewal*`, `next_action*`) with no key authored at all. That heuristic was already
  live on `date` columns; it now answers the same on `datetime` columns, which is the
  parity being restored.

`DateTimeFieldMetadata` gains `dueLike?: boolean`, which `DateFieldMetadata` already
carried. Nothing narrows and no accepted input is rejected: the key was already accepted
by the view schema for both types, and leaving it off the datetime interface would have
kept the declared-vs-enforced mismatch alive with the sign flipped — a key the renderer
honours but the authoring type rejects.

The affordance is day-granular on both cells, inherited from the shared relative-time
path rather than re-decided here: the wording gates on whole calendar days, so a
datetime a few hours past its deadline still reads "Today" and is not red, and
"Overdue 0d" is not a string this codebase can produce. Sub-day precision is a separate
call and was not taken.
