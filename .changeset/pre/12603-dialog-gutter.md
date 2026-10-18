---
'@object-ui/components': minor
'@object-ui/app-shell': patch
'@object-ui/fields': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-form': patch
---

Every wide centred dialog keeps a 1rem gutter on each side of the window from `sm` (640px) up, by one shared class (objectui#12603).

`@object-ui/components` adds one export, `DIALOG_VIEWPORT_GUTTER` (`sm:w-[calc(100%-2rem)]`): the gutter `ModalForm` introduced for its `lg` and `xl` sizes (objectui#12593), promoted so every wide dialog reads the same value. A dialog that raises its cap with `sm:max-w-2xl` or wider writes this constant beside the cap.

Dialogs that ran edge to edge between `sm` and their max width and now keep the gutter:

- the action modal's `lg` and `xl` sizes (`xl` is what a `type: 'modal'` action with a page target and no size opens at);
- the action parameter dialog with a long parameter list, the flow runner's object-form or long screen step, and the CEL test-run dialog;
- the full-screen text editor dialog, the image lightbox and the import wizard.

The record picker reads the same class under every width rung; it kept a `95vw` margin of its own before, so between `sm` and its cap it is now the window less 2rem instead. `ModalForm` reads the shared export instead of its private copy, with no change in output.

Unchanged: sheets, the phone sheet below `sm`, the `full` size (`95vw`), and every dialog's width on a window wider than its max width plus 2rem.
