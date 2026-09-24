---
'@object-ui/types': patch
---

The `dateField` alias refusal that objectui#8355 adds to a calendar binding
quotes only the first clause of the calendar refusal screen, "Calendar
configuration required": the clause objectui#8170 left unchanged
(objectui#10030).

That refusal message tells an author what happens when the alias is kept rather
than refused: the calendar falls through to its refusal screen. Quoting only
the first clause keeps the message true of that screen both as published and as
objectui#8170 rewrites it. The rewrite keeps the first clause and replaces the
second sentence, which named `titleField` as required; `titleField` is optional.
The message's closing claim, that the screen names the canonical keys and never
the key the author wrote, holds for both versions of the screen.
