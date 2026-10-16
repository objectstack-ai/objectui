---
'@object-ui/app-shell': patch
---

Studio's new validation rules, hooks and actions start from safe defaults (objectui#11820).

- **Validation rules.** A new Script, Cross-field or Conditional rule is no longer saved as a rule that can never fire. It used to be written to the object draft at once with the condition `false` and no "Runs on" box checked. Now it is listed and open but not saved, marked "Not saved — needs a condition", with the same "Not saved yet" line Studio shows for other unfinished edits, until you give it a condition (for a Conditional rule, its Then rule's condition too). Leaving the Rules view before then discards it. Every new rule starts on Create + Update. An existing rule is edited as before.
- **Hooks.** A new hook still targets the object you create it from. Its object picker now lists this package's objects first, and puts every other object (other packages' objects and the platform's own `sys_*` tables) under "Other objects" with a line saying a hook there runs on that object's events wherever they happen. "All objects (*)" shows the same kind of warning. Choosing either deliberately still works. The metadata admin's hook editor, which knows no package, keeps its flat list.
- **Actions.** A new action starts as "Update fields on this record — no code" instead of a sandboxed-JS script, and you add the field values it writes.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
