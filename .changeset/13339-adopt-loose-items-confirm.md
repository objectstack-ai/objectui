---
'@object-ui/app-shell': patch
---

Setup → Packages: in a package's sheet, *Adopt loose items* asks in the in-app confirmation, reports how many items it adopted, and each action clears the previous action's message (objectui#13339).

*Adopt loose items* used the browser's native confirm, which an embedded frame can block or answer on its own. It now opens the sheet's in-app dialog, like Delete and Discard; its Cancel sends nothing. After an adoption the sheet says "N items adopted into this base.", with the count the server answers (`reassignedCount`), so an adoption that found nothing reads "0 items adopted into this base." instead of "Loose items adopted into this base.".

The sheet's message line now answers the action the administrator started last. Pressing Duplicate, Delete app, Discard changes, Adopt loose items, Edit or View info clears the previous action's message, as the actions that run straight away already did; a Revert refusal no longer stays under the Duplicate form. English and Chinese.
