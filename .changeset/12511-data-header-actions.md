---
'@object-ui/app-shell': patch
---

Studio Data pillar: the object header shows the same controls on every tab (objectui#12511).

- **Object settings icon removed.** The Settings tab, one row below, is the way to open an object's settings.
- **More (⋯) menu removed.** Its only entry was Add field; the header has no object-level action left to put in a menu.
- **Add field lives where fields are laid out**: the Form tab's toolbar, and the "+" column at the end of the Records grid's header. Both add the same field card and open its inspector. On a read-only package neither is offered, as before.
- The header's right side now holds only the save status ("Saving…" or "Saved HH:MM"), on Records, Form and every power panel alike.

Three strings that only the removed controls used are retired from the metadata-admin designer's own table (en and zh); no export, prop of a published component, or language-pack key changes.
