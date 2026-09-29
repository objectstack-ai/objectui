---
'@object-ui/types': patch
---

`ObjectViewSchema`'s `table` and `form` slots now ship the members they promise
(objectui#6269). Both were declared by deriving from the schema they document — `table?:
Partial<Omit<ObjectGridSchema, 'type' | 'objectName'>>`, `form?: Partial<Omit<ObjectFormSchema,
'type' | 'objectName' | 'mode'>>` — and both derived types declared **zero** properties.

`Omit<T, K>` is `Pick<T, Exclude<keyof T, K>>`, and `keyof T` on a type carrying a string index
signature is `string | number` — the literal member names are absorbed. `ObjectGridSchema` and
`ObjectFormSchema` both inherit `BaseSchema`'s `[key: string]: any` (objectui#5155), so each
`Pick` rebuilt a type holding the index signature and none of the named members. Measured
through the TypeScript checker: `ObjectGridSchema` 61 members, the `Omit` of it 0;
`ObjectFormSchema` 67, the `Omit` of it 0. This is objectui#6151's collapse in *property*
position — #6151's guard walks the `LayoutSchema` union and cannot see properties on
`ObjectViewSchema`.

Nothing errored, because the index signature answered every key as `any`. The visible costs
were the ones only a reader of the declaration meets: `table: { colunms: 3 }` type-checked,
`table: { pageSize: 'ten' }` type-checked, and editor completion inside `table: { … }` offered
nothing at all for a slot documented as "inherits from ObjectGridSchema".

Each `Omit` is now a `Partial<Pick<…>>` over an explicit key list — at this change 59 keys for
`table`, 64 for `form`, i.e. every declared member minus the identity keys the view itself fixes.
`Pick` with literal keys never computes `keyof T`, so it cannot collapse the same way. The key
lists are pinned against silent drift by
`packages/types/src/__tests__/object-view-slot-key-lists.test.ts`, which recomputes each source
schema's declared members through the TypeScript checker and, at this change, requires set
equality; a member added to `ObjectGridSchema` and not to the list turns it red.

**Tightening, deliberately.** Restoring named members re-enables excess-property checks on
object literals assigned into these two slots, so a misspelled key there is now an error
instead of silently doing nothing. That is the intent of the fix. At this change the slots'
member *types* are unchanged — every key that resolved to a real declared type before still does.

At this change the `Pick` lists exist only because `BaseSchema` carries a root string index
signature: when an objectui#5155 phase removes it, `Omit` stops collapsing and the lists (plus
their pin) become removable. The pin's own comment records the condition, and one of its
assertions is the tripwire that will notice.

⚠️ **Dated note, 2026-09-29 — the `table` list became a deliberate subset — objectui#10976.**
Later in this same release `ObjectGridSlotKey` no longer lists every `ObjectGridSchema` member
but the identity keys: it lists the grid keys `ObjectView` hands the grid it draws, and the other
grid keys stop resolving on `table` (a type error, and refused by name by the validator). So for
`table` the count, the unchanged-member-types sentence and the removal condition above no longer
hold: the pin requires the `table` list to equal the source members minus the identity keys and
a withheld set, and that list and its pin stay after an objectui#5155 phase. The `form` list is
not changed by it. The rest of this entry is kept as the reading of this change; the
objectui#10976 entry states what ships.
