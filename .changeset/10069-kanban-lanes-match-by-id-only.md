---
'@object-ui/plugin-kanban': minor
---

fix(plugin-kanban): a kanban lane matches records by its `id` only, never by its `title`

⚠️ Behaviour change (narrowing), declared `minor` under this repo's fixed-group
versioning. Executes maintainer ruling A on objectui#10069.

A kanban board decides which lane a record belongs to by comparing the record's
stored `groupBy` value with each lane's `id` — the picklist option value. Until
now `bucketCardsIntoColumns` also lowercased every lane `title` into that lookup,
so the title was a second, undeclared bucketing key. That had three
user-visible effects, and all three are gone:

- renaming a lane in authored `columns` moved records between lanes;
- relabelling a picklist option moved records too, because lanes derived from
  the `groupBy` field's options take `title: opt.label`;
- membership depended on the viewer's locale, because lane titles are
  translated: a record storing the English label bucketed into its lane in one
  locale and into "Uncategorized" in another.

The lane `title` is now presentation only. The id comparison keeps its existing
case folding (`IN_PROGRESS` still matches a lane `in_progress`).

A record whose value matches no lane id still surfaces in the trailing
"Uncategorized" lane (#2792), and the board now also names it on the console:
one `console.warn` per distinct raw value per bucketing pass, giving the
`groupBy` field, the raw value, the number of records carrying it and the
available lane ids. An empty group value is not warned about.

**Migration.** Records whose group field stores an option's LABEL (for example
`'In Progress'`) instead of its VALUE (`'in_progress'`) used to reach their lane
through the retired title match; they now appear under "Uncategorized", and the
console warning names each such value. Fix the data, not the board: update each
record to store the option value. A drag from "Uncategorized" into the right lane
writes the lane id and so repairs one record at a time; for a bulk repair, find
the affected records with a filter that selects values outside the field's
option values, e.g. `['and', ['status', 'nin', ['in_progress', 'done']],
['status', '!=', null], ['status', '!=', '']]`, and update each to the value
whose option label it stores. ⛔ Do not add the label as a lane `id` to make the
records reappear: that re-teaches the label as a second value for the same state.
