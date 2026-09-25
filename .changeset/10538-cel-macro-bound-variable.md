---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow designer's "not in scope" warning no longer flags a CEL comprehension macro's own iteration variable (objectui#10538)

`findUnknownRefs` read every root identifier in a CEL source as a flow variable, so the `r` in `rows.map(r, r.subject)` drew an amber "not in scope" warning. That included the assignment-value example in `@objectstack/spec`, `joinNonEmpty(rows.map(r, r.subject), "\n")`. The scanner now treats the first argument of `map`, `filter`, `exists`, `all` and `exists_one` as a variable bound inside that macro's own argument list. The same name used outside that list (after the closing parenthesis, or as another macro's receiver) is still checked as a root, and an unknown receiver is still flagged with its suggestion. The warning stays advisory; nothing about what blocks Save changes.
