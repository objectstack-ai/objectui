---
'@object-ui/components': patch
---

A `page:tabs` item whose `visibleWhen` faults on evaluation is no longer drawn (objectui#13286).

A predicate that cannot be evaluated (a source over the CEL engine's AST bound, a type error, an unbound root, a missing function) used to fall back to visible, so the tab drew for a viewer the predicate was written to exclude. It now fails closed: the tab, header and panel, is withheld, and the fault is logged once per authored source through the same console report as before, now saying the tab was withheld. If the withheld tab was the active one, the strip falls back to the first visible tab. A tab with no `visibleWhen`, or a blank one, is still shown, and a predicate that evaluates decides exactly as before. Form field rules keep their documented fail-open.
