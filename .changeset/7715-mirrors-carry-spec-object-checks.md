---
'@object-ui/types': minor
---

fix(types): the spec-derived `ListViewSchema` and `PageNodeSchema` refuse what the spec's publish door refuses — they now run the spec's own object-level checks (objectui#7715)

**Breaking (accept-set narrowing, shipped as `minor` per this repository's version-alignment rule):** `safeValidateSchema` / `validateSchema` and the two schemas below now refuse two document shapes they used to accept. Both were already refused by `@objectstack/spec` at publish; objectui's authoring door said yes and the author heard no until publish.

A mirror built from the spec's `.shape` (`specFieldsExcept(...)`) takes the spec's fields by reference and drops every check the spec attaches to the object itself. `@objectstack/spec` exports those checks as named functions, and each mirror now attaches the ones whose fields it carries — the spec's function, not a copy, so the refusal an author sees is the spec's own message:

- **`ListViewSchema`** attaches `checkListViewCalendarVisualization`: a `list-view` node whose `appearance.allowedVisualizations` includes `'calendar'` with no `calendar:` block is refused at `calendar`. Fix a refused document by declaring `calendar: { startDateField: '<date_field>' }`, or by removing `'calendar'` from `allowedVisualizations`.
- **`PageNodeSchema`** attaches `checkPageSourceCompleteness`: a `page` node of `kind: 'html'`, `'react'` or `'jsx'` with no non-empty `source` is refused at `source`. Fix it by supplying the page's `source`.

The spec's other `ListViewSchema` check, `checkListViewPageMount`, is **not** attached: it reads `type`, which on a `list-view` node is the component discriminator rather than the spec's view kind (that rides as `viewType`), so attaching it would refuse every `pageName`, a valid page mount included. The navigation-area, app, dashboard-widget and dashboard mirrors attach nothing because their spec objects carry no object-level check at the resolved spec release. `GlobalFilterSchema` already ran the spec's date-default check through its delegating re-parse and is unchanged.

`packages/types/src/__tests__/spec-object-refinements-7715.test.ts` accounts for every object-level check each of the six spec objects carries, so a check the spec adds in a later release fails there by site name instead of being dropped.
