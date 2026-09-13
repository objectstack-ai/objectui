---
'@object-ui/app-shell': patch
'@object-ui/react': patch
---

Resolve filter placeholders on the drill "escape hatch", so one drill has one scope
whatever `drillDown.target` says (objectui#9022).

Every widget composes its drill filter from the RAW authored filter, so
`{current_user_id}`, `{current_org_id}` and the relative-date macros were still
literals when they reached the host's `openRecordList`. The in-place drawer arm never
had the defect — the `object-data-table` it renders resolves the filter in its own
fetch — so only the navigate arm, and the "Open in list →" button in the drawer header,
wrote the placeholder into the URL. `filter[close_date][gte]={current_quarter_start}`
parses back on the read side as an ordinary string comparand, so the destination list
matched nothing, silently, and in disagreement with the chart bar the user had just
clicked (that chart scopes its own bars by the RESOLVED value).

`useOpenRecordList` now expands both placeholder vocabularies against the session scope
it already sits inside, immediately before serialization. It is the single host handler
every escape hatch funnels through — the chart's navigate arm and its own header
button, `DrillDownDrawer`'s navigate arm, and `OpenInListButton` — so both widget
families are covered by one resolution rather than N widget seams. A drill carrying no
placeholder produces a byte-identical URL: both vocabularies substitute whole-string
`{token}` values only.

The `DrillNavigationValue.openRecordList` contract now states that resolving is the
host implementation's job, since an out-of-repo host wiring the same context would
otherwise reproduce the split.
