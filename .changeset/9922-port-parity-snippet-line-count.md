---
---

`check-upstream-port-parity --list` now reports each declared divergence at its
real size: `split('\n')` on a newline-terminated snippet yields a trailing empty
element that is the last line's TERMINATOR, so every listed snippet printed one
line too many — a one-line adaptation read as two (objectui#9922). The count is
computed by a named `snippetLineCount` that pops exactly one trailing terminator
and never subtracts blindly, so a snippet that does not end in a newline keeps
its real last line. The gate's own self-test carries that unterminated case as a
fixture (the pinned population cannot supply one), and the wiring test checks the
printed listing against the snippets stored in the pin. Tooling only; no package
is released by this change.
