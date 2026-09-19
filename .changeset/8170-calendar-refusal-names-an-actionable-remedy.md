---
'@object-ui/plugin-calendar': patch
---

`ObjectCalendar`'s refusal screen now states a remedy an author can act on, on every
door it is reachable from (objectui#8170).

It used to read "Calendar configuration required. Please specify startDateField and
titleField." The first clause was right and is unchanged. The second was wrong twice:

**It demanded an optional key.** `@objectstack/spec`'s `CalendarConfigSchema` is a
strict object whose ONE required key is `startDateField`. Re-measured on the installed
17.4.0, three legs via `CalendarConfigSchema.safeParse` from `@objectstack/spec/ui`:
`{}` and `{ titleField: 't' }` both fail `invalid_type` at `startDateField`, and
`{ startDateField: 'd' }` parses clean. The spec's own note on that schema names this
renderer as the reason — `resolveTitle` takes an explicit `titleField` when present and
otherwise resolves through the ADR-0079 record display-name chain, so the screen was
asking for a key the component neither needs nor reads.

**It named keys without saying where they go, which is unactionable on an interface
page.** That surface's `interfaceConfig` has no calendar slot at all — it reads
`columns`, `sort`, `filterBy`, `userFilters`, `appearance`, `addRecord`, `userActions`,
`showRecordCount`, `source`, `sourceView`, `buttons` and `recordAction`, and no calendar
key — so the only lever there is `sourceView`, which the screen never mentioned. The
refusal was honest about the binding and dishonest about the remedy.

The new copy names the one required key, says the title resolves without `titleField`,
points at the view's `calendar` block as the place both doors read the binding from, and
states the interface page's indirection outright.

**Why the wording is door-COMPLETE rather than door-AWARE.** Two producers emit an
`object-calendar` node — the calendar branches of `plugin-list`'s `ListView` and
`plugin-view`'s `ObjectView` — and app-shell reaches the first from both its `ObjectView`
(object-view door) and `InterfaceListPage` (interface-page door). Every one of them hands
the component the same shared `baseProps` bag plus whichever declared binding keys exist:
nothing on the node names the door. A door-aware screen therefore needs a newly declared
prop threaded through four packages, and inferring the door from whether the object
carries a date field only correlates with it — `InterfaceListPage`'s deriver runs solely
when `calendar` is whitelisted in `appearance.allowedVisualizations` — which is the
"the gate and the seam must answer one question" failure this repo has recorded on `map`,
`chart` and `kanban` already.

The first clause is unchanged on purpose: five suites pin this screen with
`/Calendar configuration required/i`, and `@object-ui/types`' calendar alias tombstones
assert on the same phrase. Only the clause that was wrong moves. The new second clause is
pinned in `ObjectCalendar.refusalRemedy-8170.test.tsx`, together with the runtime control
that makes its claim checkable: a calendar with a date binding and no `titleField` renders
real record titles.
