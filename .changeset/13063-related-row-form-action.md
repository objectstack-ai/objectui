---
"@object-ui/core": minor
"@object-ui/app-shell": patch
---

A `type: 'form'` action placed at `record_related` and fired from a related-list row now opens the clicked row's edit form (`/forms/NAME?recordId=ROW_ID&recordObject=CHILD`), as it does from the child's own record page, instead of a blank create form (objectui#13063). The related-list bridge hands the row to the dispatch as its execution context (`record` + the child's `objectName`); `ActionRunner.execute` takes that per-call context as an optional second argument and leaves the runner's own context untouched.

`@object-ui/core` widens one published method: `ActionRunner.execute(action, callContext?)`. `callContext` is optional, so every existing caller is unchanged.
