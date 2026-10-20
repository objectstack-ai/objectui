---
'@object-ui/app-shell': patch
---

The language menu asks before a switch drops a page's unsaved edits (objectui#13254). The console shell remounts every page on a language change, so switching the language on a page that holds unsaved edits (a settings page, a metadata edit page) used to drop them with no question. `LocaleSwitcher` now goes through `confirmUnsavedLeave`, the same guard as the header's other menu entries: while a page holds unsaved edits, picking a language asks that page's own question first. Cancel keeps the language, the edits and the stored `sys_user.locale`; OK switches as before. With no unsaved edits the switch happens at once, as before. The entry already checked asks too, because picking it still writes `sys_user.locale`.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
