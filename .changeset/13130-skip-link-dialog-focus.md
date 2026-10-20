---
'@object-ui/app-shell': patch
'@object-ui/plugin-form': patch
'@object-ui/i18n': patch
---

Keyboard access to the console: a "Skip to content" link, and record dialogs that open on their first field (objectui#13130).

- **Skip to content.** The console shell's first Tab stop is now a "Skip to content" link. It stays out of sight until it is focused. Activating it moves focus to the element that holds the page, so the next Tab reaches the page's first control without walking the app bar and every sidebar entry. It moves focus without writing a hash into the URL. Its text is the new `console.skipToContent` key in all ten language packs.
- **Create/Edit dialogs open on their first editable field.** `ModalForm`'s dialog opened with focus on its Close button (the master-detail dialog on one of its buttons), never on a field. Its body (the object schema, the record on edit, and the field widgets) loads after the dialog opens, so when the dialog took focus no field was there yet. While the body loads, the dialog now keeps focus on itself. When the fields arrive, focus moves to the first field that can be edited, skipping disabled and read-only ones. If the user has already moved focus to another control, focus stays there. This covers both of `ModalForm`'s dialogs: the flat form and the master-detail form.

No export, prop or schema key is added.
