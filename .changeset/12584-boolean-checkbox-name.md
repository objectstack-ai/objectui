---
'@object-ui/fields': patch
---

A boolean cell's read-only checkbox is named by its field (objectui#12584).

The boolean cell renderer draws a plain checkbox for every boolean column outside the completion and status names. It had no accessible name, so a screen reader announced each cell of the Studio Records grid and the runtime list grid as a bare "checkbox, not checked", with nothing to say which field it was. The checkbox is now named by the field's label, or by its humanized name when the field declares no label, the same words the status field's "Off" badge prints. The name carries no state word: the checkbox role announces checked or not checked itself.

The humanized-name fallback now reads the field name as authored, for the checkbox and the "Off" badge alike. It read the lower-cased name before, so an unlabelled `IsPreferred` read `Ispreferred`. A spec-legal field name is lowercase snake_case already, so for every such field the words are unchanged.

Nothing else moves: no visual change, no new language-pack key, and no export, prop or type member.
