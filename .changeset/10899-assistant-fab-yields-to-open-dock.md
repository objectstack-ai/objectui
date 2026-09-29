---
'@object-ui/app-shell': patch
---

fix(app-shell): the assistant FAB is hidden while the chat dock is open (objectui#10899)

The console's round assistant button is the chat dock's collapsed affordance
(ADR-0057), but `ConsoleLayout` rendered it whether the dock was collapsed or
open. With the right rail open inside an app, the `fixed bottom-6 right-6`
button sat on top of the rail composer's send button, so only the Enter key
could send.

The FAB now renders only while the dock is collapsed — the same rule the Studio
dock's `ChatDockLauncher` already follows. The open rail and the mobile sheet
keep their own collapse and close controls.
