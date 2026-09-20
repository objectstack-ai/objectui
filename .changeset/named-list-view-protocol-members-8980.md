---
'@object-ui/types': minor
'@object-ui/plugin-view': minor
---

**`NamedListView` declares the 17 members the protocol declares on the same
surface, and each one now has a read point** (objectui#8980, director-seat
class-one adjudication of 2026-09-13, under the maintainer's standing principle
that the objectstack protocol is the source of truth and objectui catches up to
it rather than the other way round).

`appearance` `calendar` `chart` `data` `fieldOrder` `gallery` `gantt` `grouping`
`kanban` `map` `name` `pageName` `rowColor` `tabs` `timeline` `tree`
`userActions` — all seventeen were declared by `ObjectListViewSchema`
(`@objectstack/spec/ui`), the declared value type of both `ViewSchema.listViews`
and `ObjectSchema.listViews`, and by none of them by `@object-ui/types`. An
author writing the shape the protocol teaches got a view that rendered as though
nothing had been configured, with no diagnostic anywhere.

**Types are taken from the protocol, not restated.** Sixteen index this
package's own spec-derived `list-view` node type (`ListViewSchema`), whose
members arrive from `SpecListViewSchema.shape` by reference — the derivation
`NamedListView.userFilters` already used, and the one that keeps a named view
and the `list-view` node it is relayed into the same type for every key that
crosses. `name` indexes the protocol's own published authored type (`ListView`,
`@objectstack/spec/ui`) directly, because on the node that spelling resolves
through `BaseSchema.name` — the component-name slot, a different contract
wearing the same word.

**What an author can now do that silently did nothing before:**

| key | reaches |
| --- | --- |
| `kanban` `calendar` `gallery` `timeline` `gantt` `map` | the renderer `ObjectView` dispatches to for that `type` — `ObjectKanban`, `ObjectCalendar`, `ObjectGallery`, `ObjectTimeline`, `ObjectGantt`, `ObjectMap` — at the protocol's own top level. The legacy `options.<kind>` nesting keeps working; a canonical block wins key-by-key over it, so a partially declared block does not blank its legacy neighbour |
| `chart` `tree` | the same dispatch, on the one route objectui#5321 leaves open to a named view (it declares no `type`, a host `views` entry selects the kind) |
| `grouping` `rowColor` | `ObjectGrid` on the authored grid path, and `ListView` through the host delegation |
| `fieldOrder` `appearance` `userActions` | `ListView` through the host delegation. `fieldOrder` is the live third key of the protocol's `columns` × `hiddenFields` × `fieldOrder` composition (objectstack#15184 ruling B) |
| `data` | `ListView` — and the `as any` cast the renderer used to reach this key through is gone, which answers objectui#7928's open half |
| `name` | the named-view tab strip, between `label` and the record key |

**Two members are declared and NOT read, and that is the ruled outcome rather
than an oversight** — the ruling requires a member with no renderer behaviour to
be reported with its measurement, never silently dropped from the type.
`tabs` on the list shape is the `ViewTabSchema[]` multi-tab definition list (not
`userFilters.tabs`, which the protocol omits from an object view as page-only),
and objectui's tab bar for an object is the host-owned saved-view switcher
(ADR-0053). `pageName` configures the protocol's `type: 'page'` branch, and
`page` is not a member of `NamedListView['type']`. Both measurements are reported
on objectui#8980.

**Compatibility.** Every addition is an optional member, and every read is a new
rung whose source could not be authored before this change — so on existing
documents the renderer produces the same nodes it produced before, proven by an
absence-control case beside each fix. The 19 legacy spellings `NamedListView`
declares beyond the protocol are objectui#7924's remedy and are untouched.
