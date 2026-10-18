---
'@object-ui/plugin-form': patch
---

An `lg` or `xl` `ModalForm` dialog keeps a 1rem gutter on each side of the window from `sm` (640px) up (objectui#12593).

The two sizes are bounded at 672px (`lg`) and 1024px (`xl`), but the dialog took the full width of any window narrower than that, at x = 0, with no margin. Since every field-heavy create or edit in the console opens `lg` or `xl`, a laptop or tablet window between 640px and 1056px drew those dialogs edge to edge. Both sizes now read one shared width, the window less 2rem, under their own max width, so the dialog is centred with an equal gutter. On a window wider than the max width plus 2rem each size is exactly as wide as before.

Unchanged: the `sm`, `default` and `full` sizes, the full-screen sheet below `sm`, and the dialog's height rules. Nothing is added to the package entry: no export, prop, type member or `modalSize` value.
