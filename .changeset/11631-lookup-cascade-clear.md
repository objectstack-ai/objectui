---
'@object-ui/components': patch
---

A lookup whose `dependsOn` names a parent field drops its selection when that parent changes or is cleared (objectui#11631).

Before, the picker re-scoped its candidate list to the new parent but kept the record already chosen. An invoice whose Account was switched from Northwind to Contoso saved Contoso beside a Northwind contact. The server checks only that a reference exists, so it accepted the pair. Now the form clears the dependent lookup as soon as any parent that scopes it takes a different value. It writes `null`, or `[]` for a multi-value lookup, so an edit clears the stored value instead of leaving it unchanged. A cleared lookup that scopes another lookup clears that one too.

What does not clear it: opening an existing record, whether its values are present when the form mounts or arrive after; switching a mounted drawer to another record; a `resetOnSubmit` or Cancel reset; a change to any other field. A lookup that holds nothing is not written to. Which parents count is read from the same field-level `dependsOn` array the picker scopes its query by, so a `dependsOn` the picker ignores clears nothing either.

The rule covers every form the `form` renderer draws, including the object form and its drawer, modal, split, tabbed and wizard variants. The console's form-view page (`/forms/:name`, `/f/:slug`) has its own renderer and is not changed here.

**Clause-②: no.** Nothing on the package entry changes. No export, prop, type member or i18n key is added, and `CASCADE_OPTION_WIDGET_TYPES` is unchanged.
