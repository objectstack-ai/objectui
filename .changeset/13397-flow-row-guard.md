---
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
---

A record-scoped flow action launched from a list toolbar with 0 or several rows selected is refused before its param dialog opens, and its refusal is translated (objectui#13397).

The console's `flowHandler` now carries `refuseBeforeInput`, the early refusal objectui#13384 gave the `script` handler, answered by the same resolver its dispatch runs. The runner asks it before the confirmation and the param dialog, so "select a row first" and "select exactly one row" show in the session's language before the user fills anything in, and nothing is sent. With exactly one row the flow behaves as before. A direct call that is refused at dispatch time is shown through the refusal's pack key too.

The console server-action wrapper's `newTabUrl` refusal ("no record id available") now has a pack key, `console.serverAction.noRecordId`, defined in every shipped pack, and the wrapper's fast path shows the resolver's own refusal through its pack key.
