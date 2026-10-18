---
'@object-ui/app-shell': patch
---

Studio keeps an incomplete field or step as an unsaved edit with a hint, instead of showing a red error before the author can finish it (objectui#11786).

- **Data page.** Switching a field to Picklist (or Radio) before it has an option, or to Lookup (or Master-detail) before its target is picked, no longer draws a red "Changes not saved" strip. The edit stays on screen, unsaved. The inspector says what the field needs under the options editor ("Add at least one option") or under the related-object picker ("Pick the object to link to"), and a neutral line names the field, with "Show me" when its inspector is not open. Adding the option or picking the target saves the change as usual.
- **Automations page.** A step added before its required inputs are filled in, such as a new Notify step without a Title, is no longer sent, so it no longer draws a 422 and a red strip. The step's inspector says "Required" under that input, and the same neutral line names the step and the input.
- **Publish.** While a page holds such an edit, Publish refuses and names the field or step, instead of publishing the last saved drafts without the edit.

Studio decides "incomplete" with the same checks that would refuse the save: the object write guard for fields, and the flow rules from `@objectstack/spec` for steps. A save of a finished draft that is refused still shows the red strip, with the raw text under "Details", as before. Nothing is added to the package entry: no export, prop, type member or language-pack key. The new strings are rows in the metadata-admin designer's own string tables (en and zh).
