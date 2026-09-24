---
'@object-ui/types': patch
---

The `dateField` alias refusal on a calendar binding no longer quotes a calendar
refusal screen that never shipped (objectui#10030).

When a calendar's `dateField` alias lands as a node binding, its refusal message
explains what would have happened if the key had been kept: the calendar falls
back to its refusal screen. The message quoted that screen in full, including a
second sentence that objectui#8170 rewrote because it named `titleField` as
required. `titleField` is optional. The message now quotes only the screen's
first clause, "Calendar configuration required", which objectui#8170 left
unchanged. The rest of the message is unchanged: the screen still names the
canonical keys and never the key the author wrote.
