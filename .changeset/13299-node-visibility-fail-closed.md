---
"@object-ui/react": patch
"@object-ui/components": patch
---

A page node whose declared `visibleWhen` / `visible` / `visibleOn` predicate cannot be evaluated (over the CEL bounds, a type error, an unbound root, a missing function) is no longer rendered: page visibility gates now fail closed, as a `page:tabs` item already did. The fault is still reported once, and the console line says the node was withheld. A blank gate still means "no gate", and a predicate that evaluates decides as before. A `page:tabs` badge no longer counts a related list withheld this way. Form field rules keep their fail-open (objectui#13299).
