---
'@object-ui/app-shell': patch
---

An object field whose `visibleWhen` names `current_user.hasCapability(NAME)` is now answered on the record form page and in the console's record-form modal (objectui#13083).

objectui#13006 bound the viewer's held system capabilities into the shell's predicate scope, so page nodes, navigation and actions already answered `hasCapability`. The two form surfaces build their field-list evaluator themselves, and they passed the viewer's object permissions but not the capability list. Every `hasCapability` field gate there faulted: the field was shown to holders and non-holders alike, with a console diagnostic. Both now hand on the same list the shell's provider binds, so the field shows for a viewer holding the capability and hides for one who does not.

While the permissions answer has not loaded, the predicate still faults loudly, as it does on page predicates; it is never read as `false`. Nothing is added to the package entry.
