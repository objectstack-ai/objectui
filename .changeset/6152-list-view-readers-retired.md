---
'@object-ui/plugin-list': minor
'@object-ui/plugin-view': minor
'@object-ui/app-shell': minor
'@object-ui/plugin-timeline': minor
'@object-ui/types': patch
---

feat(plugin-list)!: the renderers stop reading the list-view keys every door refuses: the pre-#2231 aliases, `calendar.defaultView`, and the undeclared keys a per-kind block carries (objectui#6152, round 14)

Clause-②: no

**Changed (breaking for a stored view that carries a refused key).** Rounds 11 and 12 of
objectui#6152 closed the doors: `@object-ui/types`, `objectui validate` and `@objectstack/spec`'s
view write door refuse these keys on a list view's per-kind blocks, top-level and under the legacy
`options` bag. The renderers kept reading them, so a view stored before the doors closed still
rendered as written. They no longer read them, on every route that did: `ListView`, the object
page's relay (`@object-ui/app-shell`), `ObjectView`'s own views (`@object-ui/plugin-view`) and
`ObjectTimeline`. A stored view that carries one of these keys still renders, without what the key
used to bind. Write the spec's key instead:

| stored key (either nesting) | what renders now | write instead |
| :--- | :--- | :--- |
| `kanban.groupField` | lanes from the object's declared lifecycle field, as for a view that names none | `kanban.groupByField` |
| `kanban.cardFields` | cards show `kanban.columns`, or the view's own fields | `kanban.columns` |
| `gallery.imageField` | no cover binding: `ObjectGallery` tries `image`, and the Gallery view is not offered | `gallery.coverField` |
| `timeline.dateField`, and `calendar.dateField` read as a timeline axis | no timeline axis: the timeline's refusal names the keys to write, and the Timeline view is not offered | `timeline.startDateField` (or `calendar.startDateField`) |
| `calendar.defaultView` | the calendar opens on its own default view | nothing on a list view: the initial mode is the `object-calendar` element's flat `defaultView` |
| `kanban.swimlaneField` and any other undeclared kanban key | not drawn | nothing: the spec's kanban block has no swimlane |
| `tree.titleField` | the tree labels by `name` | `tree.labelField` |
| an undeclared key under `calendar`, `tree` or `gantt`, or anything under `options.grid` | not forwarded to the view | the block's declared key, or a top-level key of the view for a grid |

The declared keys keep their route: `kanban.summarizeField`, `calendar.colorField` and
`calendar.allDayField` are now read by name where the removed spreads used to carry them, and every
`gantt` key the spec declares reaches the gantt through a typed table that `tsc` keeps total. A
block key named like a node key (`objectName`, `filter`) can no longer override the node's own
value. `ListView`'s projection collectors stop asking the server for the fields these keys named.

**Not measured: production.** The census before this change (objectui#6152 round 13) found no
writer and no stored row carrying these keys in any repository corpus a seat can reach, with
positive controls; stored view and page metadata in deployments was not measured. A row that
carries one of these keys renders as the table says until it is re-saved with the key on the
right.

Not in this change: the legacy chart axes (`chart.xAxisField`, `yAxisFields`, `categoryField`,
`valueField`, `aggregation`), which `ListView` still reads until the next round on objectui#6152.

- `@object-ui/types`: the refusal messages of these keys no longer say a stored view still renders
  through the alias, and the kanban `groupBy` refusal no longer suggests the refused `groupField`.
