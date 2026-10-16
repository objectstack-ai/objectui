---
'@object-ui/plugin-timeline': patch
---

An object timeline with a `groupByField` draws one group per value, headed by the value's display name (objectui#12104).

- **A lookup groups by the referenced record's name.** The timeline's own query expands every declared relation, so a lookup value arrives as the related record, and the group header used to read "[object Object]" for every row: a timeline grouped by an owner or an account drew one group. The group key now reads the field's display value through the same resolver the entry title and description use. A select field still groups by its option's label. An empty value groups under "Unassigned", and when no row has a display value the timeline keeps its date buckets. A lookup that arrives unexpanded groups under its id, which is what the title shows for it too.
- **A key's rows are gathered into one group.** Entries are sorted by start date, and a group used to end wherever the next entry had another value, so a field whose values alternate in date order (a channel, say) drew the same header many times. Each value now heads exactly one group. Groups appear in the order of their earliest entry, and entries stay in date order inside each group, so a timeline whose values were already contiguous renders as before.

Unchanged: a timeline with no `groupByField` (its date buckets), the horizontal timeline, which draws no groups and keeps its date order, and the group key of a multi-valued field (a multiselect, tags, or a lookup with `multiple`), which reads as before. Nothing is added to the package entry: no export, prop or language-pack key.
