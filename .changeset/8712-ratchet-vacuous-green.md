---
---

Test- and comment-only; nothing this package publishes changes.

The objectui#8598 ratchet over builds a test spawns now judges the child
environment by what it does to `VITEST` rather than by whether the token occurs
in the expression: an environment that SETS the variable is refused, and the
rest-pattern spelling of the scrub is accepted alongside `delete`. Two comments
about `emptyOutDir` on the `./zod` bundle config are corrected to the measured
effect of a flip, and one built-artifact case is renamed to the property it
actually measures.
