---
---

One authority for "does this line open a fenced code block" (objectui#9194). Both doc
gates carried the same greedy predicate, which read a four-backtick opener as a
three-backtick fence in a language named with a leading backtick: the nesting inverted,
the code inside was read as prose, and two empty non-fences were counted as successfully
parsed in the coverage figures. The rule now lives once, as CommonMark states it — a run
of three or more opens, and only a run of the same character that is at least as long
closes. Tooling only; no package is released by this change.
