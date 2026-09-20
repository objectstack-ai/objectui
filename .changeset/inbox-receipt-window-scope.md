---
'@object-ui/app-shell': patch
---

inbox poll: read the receipts of the listed messages, not the user's whole receipt history

Every inbox tick re-read `sys_notification_receipt` in full — filtered by
`user_id` + `channel:'inbox'`, `$top: 200`, no cursor — beside the
`sys_inbox_message` read's `$top: 20`, at 10s foregrounded and 60s hidden. The
join only ever used the receipts of the messages that read listed, so the rest
were fetched, indexed and dropped on every tick.

The receipt read now names those messages' notification ids (`$in`) and is
skipped entirely when the window lists nothing a receipt could belong to. No
number the user sees moves: the bell badge's inbox addend folds the rows this
feed produces, which are one per listed message, so it was never derived from
the receipt set's size. Ceiling and answer are now the same size, which the
unique `(notification_id, user_id, channel)` key makes exact.
