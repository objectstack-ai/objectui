---
'@object-ui/fields': minor
---

One home for the `datetime` display convention in the readonly field widgets,
one face per register (objectui#8209, maintainer ruling batch #142 item 2).

The two readonly `datetime` faces in `@object-ui/fields` composed a bare
`toLocaleDateString(locale)` + `toLocaleTimeString(locale)` pair joined by a
space — no options bag on either half — so neither went through
`formatDateTime`, which objectui#7443 declared the single home for this
convention. They carried seconds that no `datetime` CELL has ever shown. Both
now call `formatDateTime`, each on the face of its display register:

- the readonly `DateTimeField` (the form / detail face, and what
  `FieldEditWidget` renders in the grid and detail inline editors) takes the
  **verbose default** face, the one every non-cell caller already gets;
- the sub-grid `GridField`'s readonly `datetime` column takes **`'compact'`**,
  the face the sibling `datetime` cell renders.

**Visible change**, measured in five locales for one instant (July 4, 07:00
local):

| locale | before, both sites | after, readonly widget | after, sub-grid cell |
| --- | --- | --- | --- |
| en | `7/4/2026 7:00:00 AM` | `Jul 4, 2026, 07:00 AM` | `7/4/2026 7:00 am` |
| de | `4.7.2026 07:00:00` | `4. Juli 2026, 07:00` | `4.7.2026 7:00 am` |
| zh | `2026/7/4 07:00:00` | `2026年7月4日 07:00` | `2026/7/4 上午7:00` |
| ja | `2026/7/4 7:00:00` | `2026年7月4日 07:00` | `2026/7/4 午前7:00` |
| ar | `4/7/2026 7:00:00 ص` | `4 يوليو 2026، 07:00 ص` | `4/7/2026 7:00 ص` |

(The `ar` rows carry U+200F marks around the date separators; they are omitted
here so the table stays readable.)

**The year is not dropped.** The year-drop is `formatDate`'s date-only cell
rule (objectui#7620); the verbose default face carries the year in every year,
and nothing here extends the drop to `datetime`.

**No new authorable key.** The sub-grid selects `'compact'` as a literal rather
than reading an authored style: the column shape this widget renders from
(`GridColumn`, mirroring the published `GridColumnDefinition`) declares no
`format` key, so there is no existing vocabulary to reuse, and declaring one
was refused. The accepted authoring set is unchanged by this release.

A value the formatter cannot parse now reads `—` at the readonly widget instead
of the literal `Invalid Date Invalid Date`. The sub-grid keeps showing the raw
stored string for an unreadable value, unchanged (objectui#3569).

With this, objectui#7443's "`datetime` has one home" holds for all six bare
no-bag sites objectui#8194 enumerated.
