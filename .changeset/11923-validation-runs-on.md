---
'@object-ui/app-shell': patch
---

Studio's validation-rule "Runs on" boxes follow the spec's events (objectui#11923).

In an object's Validations view, the "Runs on" row offered Create, Update and Delete. The spec admits only `insert` and `update` for a rule's `events`, so ticking Delete wrote a rule the object's save refused. The row now offers exactly the events the spec declares, read from `@objectstack/spec` rather than from a list kept in Studio, so it is Create and Update today.

A rule with no `events` key (authored in code or by AI) opened with no box checked, though the spec defaults it to Create and Update and the server runs it on both. Ticking Create then wrote `['insert']` and stopped the rule running on updates. Such a rule now shows both boxes checked, and each tick or untick writes the whole resulting list: unticking Create writes `['update']`. Unticking the last box writes an empty list, which the spec accepts and the server reads as running on nothing.

A rule that still carries `delete` from before this fix opens without a Delete box; its boxes show the events the server runs it on. Editing its message or another setting keeps the stored list as it is. The next tick or untick on the row writes only the spec's events, so that save goes through.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The Delete label row (en and zh) is removed from the metadata-admin designer's own string table, as nothing reads it any more.
