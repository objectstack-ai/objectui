---
'@object-ui/plugin-form': patch
---

A record drawer stays open on its first open (objectui#13238). On the first open in a page session, the drawer's body is drawn for the first time once the record is read, and its field widgets' code is still loading, so that render waits. The drawer had no place of its own to wait, so the wait was handed to the page's: in the console, the whole page was replaced by the loading screen, and when it came back a `kind:'react'` page that hosted the drawer was rebuilt and lost its own state, closing the drawer it had opened a second or two earlier. The drawer now waits inside its own sheet, as the record dialog already does: the header stays, the body shows a placeholder until its fields can be drawn, focus stays in the sheet and moves to the first field when it lands, and the page behind is never hidden. Escape, the Close button and a click outside still close the drawer.

Nothing is added to the package entry: no export, prop or type member.
