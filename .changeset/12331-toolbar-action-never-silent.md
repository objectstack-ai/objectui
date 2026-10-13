---
'@object-ui/app-shell': patch
---

A flow action launched from a list toolbar now resolves the row selection by the same rule as a script action: `@object-ui/core`'s `resolveServerActionRecordId` (objectui#12331). The flow launcher used to carry its own copy of that rule. Three things change for a flow launch:

- Its refusal reads like the script launcher's: "This action runs on a single record — select exactly one row." for several rows, and "… select a row first." for zero rows on a record-scoped action. It used to say "This flow runs on a single record — …".
- A row's id is read through the action's `recordIdField`, as it already is for a script launch. The copy always read `id`.
- An aggregate launch, one that carries the whole selection as `params._selectedIds`, is no longer refused because several rows are ticked. A script launch was already exempt.

A script action at `list_toolbar` behaves as before. It refuses zero rows on a record-scoped action and several rows on any action, and it sends nothing in either case. With one row it sends one request, and the runner's success toast reports the result. That toast shows the action's `successMessage`, filled from `${result.*}`, or the runner's generic line when the action declares no message. These behaviours are now pinned through the real list page.
