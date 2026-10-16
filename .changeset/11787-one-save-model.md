---
'@object-ui/app-shell': patch
---

Studio saves one way on a package: the permission matrix and hooks autosave to the package draft like the other pillars, every create dialog says *Save as draft*, and the Changes count keeps up with a save (objectui#11787).

- **Permission matrix, package door.** An edit is saved to the package's draft 1.5 seconds after the last change, the same autosave the Data and Interfaces pillars run, and the header shows *Saving…* and then *Saved* with the time in place of the Save button. A CEL syntax error in the row filter holds the edit and says why. An edit made while a save is in flight is kept and sent next. The set's API name can no longer be edited here, because the autosave stores the draft under that name. It is set when the set is created.
- **Permission matrix, environment-admin door.** Unchanged. It keeps its explicit Save, because it writes live access configuration (ADR-0086 D7).
- **Hooks.** A hook autosaves to its draft the same way, and the *Save hook* button is gone. A hook whose run condition does not parse is held until it does. A hook keeps the name it was created with: while its name is changed the autosave holds, and a line says to change it back. The draft is stored under the hook's name, so a rename is not a save. Creating a hook and saving one both update the Changes count.
- **Create dialogs.** *New permission set* now says *Save as draft*, like every other Studio create dialog.
- **Changes count.** After a draft save, the header no longer says "No drafts pending publish" next to an item's "Unpublished draft" chip. It counts at least the draft just saved until its next read answers, and that read is sent after the save instead of reusing a read that was already in flight.

No export, prop, type or language-pack key changes.
