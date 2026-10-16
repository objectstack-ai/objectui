---
'@object-ui/app-shell': minor
'@object-ui/react': minor
---

A navigation entry whose `visible` predicate cannot be evaluated is no longer drawn for everyone (objectui#12700).

The shell's navigation surfaces (the sidebar, the app root's landing, the activity roster read from app navigation, the `nav:menu` block and the command palette's navigation list) answer a FAULTING `visible` predicate by withholding the entry, where they used to draw it. The case that made this matter is a `current_user.can("OBJECT", "read")` gate asked where no `/auth/me/permissions` payload is bound: the expression engine refuses it, and the shell used to read that refusal as "shown", so permission-gated navigation hid nothing there. Where the payload is bound, the gate answers from it as before: a member without the grant is not shown the entry and one with it is. The fault is still reported once per predicate, now with a consequence line saying the entry was withheld. A blank gate is still "no gate" and is drawn. This is UI gating, not a security boundary: the server enforces what a member may read.

`@object-ui/react`: `PredicateGateKind` gains a `'withholding'` member, the consequence line for a visibility gate whose fault is answered by withholding the entry. `@object-ui/app-shell`'s published `evaluateVisibility` keeps its fail-open answer; the object-field gate uses it unchanged.
