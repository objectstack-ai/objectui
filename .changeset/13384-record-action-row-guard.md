---
'@object-ui/core': patch
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
---

A single-record action launched with 0 or several rows selected is refused before any dialog opens, and the refusal is translated (objectui#13384).

`ActionRunner` now asks the handler it will dispatch to for an early refusal (`ActionRunnerHandler`'s optional `refuseBeforeInput`) before the confirmation and the param dialog. The handlers `createServerActionHandler` builds answer it with the row-count check the dispatch already runs, so "select a row first" and "select exactly one row" are shown before the user fills anything in, and nothing is sent. With exactly one row the dialog behaves as before. A host that wraps the built handler in its own function keeps the early refusal only by forwarding `refuseBeforeInput`; the console's `createConsoleServerActionHandler` now forwards it, so on a list page (HotCRM's "Add to Campaign" on My Leads) the refusal toast shows and no dialog opens.

Both refusals now carry a pack key (`actions.selectRowFirst`, `actions.selectExactlyOneRow`, defined in every shipped pack). `resolveServerActionRecordId` returns it as `errorKey` beside the English `error`, and the runner's early refusal goes through its translator by that key.
