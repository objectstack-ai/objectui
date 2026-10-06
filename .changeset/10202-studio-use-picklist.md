---
'@object-ui/app-shell': minor
---

Studio reads shared picklists: a select field can use one, an object with a picklist-bound field saves again, and the picklist page is read-only (objectui#10202, the objectui half of objectstack#18164 phase 2).

A shared picklist is one list of options that select fields on several objects name with `picklist: 'NAME'` instead of carrying their own (`@objectstack/spec` 17.6.0, `data/picklist.zod.ts`). The kind is package-owned: it is authored in a package, and the runtime takes no create, edit or delete for it.

- **"Use picklist" in the select-field editor.** For a `select`, `radio`, `multiselect` or `checkboxes` field, an "Options from" picker lists the picklists the runtime serves, by name, beside "This field's own options". Choosing a picklist sets `picklist` and removes the field's `options`. A bound field shows the list's values read-only, and offers no inline options editor, because the spec refuses `picklist` together with `options`. Its default value is chosen from the list's values. Changing the field to a type that takes no options drops the binding. A stored name the served list no longer has is shown flagged as not found. If the list cannot be loaded, the picker says so and still offers the field's own options.
- **Saving an object with a picklist-bound field works again.** The runtime serves such a field with the options it resolved from the list and its extensions. The metadata-admin object designer and the Studio data page sent those back, and the save was refused with `422 INVALID_METADATA` whatever had been edited. Both now leave `options` out of every field that names a picklist. Every other field and key is sent as it was. The metadata-admin designer's live check now judges the body it sends, so it no longer reports "`picklist` and `options` cannot both be declared" on such an object.
- **The picklist page is read-only.** Its detail view shows the list's label, name, description and owning package, each option with its label and value, and the options other packages add to it (`picklistExtensions`), each under the package that declares it. It offers no create, edit or delete. The list page already offered no create for this kind.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
