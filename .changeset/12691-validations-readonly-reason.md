---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio Validations editor says why it is read-only, to hover and to the keyboard (objectui#12691)

Clause-②: no

On a read-only package the Data pillar's Validations editor disabled every control in the rule editor (type, name, label, message, the rule's own settings, runs-on, severity, priority, enabled) and gave no reason: no tooltip, no `title`, no `aria-describedby`, and Tab skipped the whole editor because a disabled control takes no focus. The Publish button and the Enabled switch on the same page already stated the reason.

The rule editor body now takes the treatment the Field properties rail got in objectui#12303. On a read-only package the body is a tab stop, named by the panel's title and described by a visually hidden copy of the package's read-only reason. It also triggers a tooltip that shows the reason. Hovering any disabled control in it, or tabbing to it, shows "Read-only package — switch to or create a writable package to edit." (zh: the existing Chinese row). One reason for the whole editor, not one per control, because every control is disabled for the same reason. The controls stay disabled, and a writable package renders exactly as before.

No export, prop or language-pack key is added. The reason is the existing `engine.studio.pkg.readonlyHint` row.
