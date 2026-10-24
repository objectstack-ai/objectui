---
'@object-ui/i18n': patch
---

zh-CN: the admin-override approval copy no longer calls the override 越权 ("exceeding one's authority", the word for a violation). The override levers now read 管理员代为通过 / 管理员代为拒绝 / 管理员代为转签 / 管理员代为撤回 (`approvalsInbox.overrideActionLabel` is `管理员代为{{action}}`), the history chip reads 管理员代办 (`viaOverrideChip`) and its hint names the 管理员代办 path (`viaOverrideHint`), and the confirmation notices say 以管理员身份代为处理 and 记录为管理员代办 (`overrideNotice*`, `overrideReassignNotice*`, `overrideRecallNotice*`). Only the zh pack changes; the rest of each sentence and every placeholder are unchanged (objectui#13402).
