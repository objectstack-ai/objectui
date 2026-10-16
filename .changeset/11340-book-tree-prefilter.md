---
'@object-ui/console': patch
---

The docs portal's book sidebar now shows what the book resolver answers, with nothing narrowing the docs in front of it (objectui#11340, ADR-0046 §6.4). The resolver decides book membership. Since objectstack#20980 (`@objectstack/spec` 17.6.0), the framework's `resolveBookTree` keeps a doc in a book's synthetic Uncategorized group only when the doc belongs to one of the book's packages: the book's own, or a group's `package`. The console's port of that resolver now scopes its Uncategorized group the same way. The console's pre-filter, which dropped other packages' docs before resolving, is gone.

What a reader sees:

- **Unchanged: another package's ungrouped doc** stays out of a book's Uncategorized group, and the book's own ungrouped docs stay in it.
- **Unchanged: a group's `package` (corner 1).** That package's unplaced docs are listed under the book's Uncategorized group, as the resolver answers. The portal already listed them, because the pre-filter kept every package the book draws from.
- **Changed: a doc of another package pinned by a group's `pages` (corner 2)** is still listed where the pin places it, and now under its own label. Before, the pre-filter had dropped the doc, so the entry showed the doc's bare name.
- **Changed: a book with no package of its own whose group names a `package`.** The groups that name no package now match docs from every package by `include`, as the resolver answers. Before, they matched only the docs of the packages the groups name.
- **Changed: a doc of another package whose `group` names a `pages` group with no `...`.** It is no longer listed under the book's Uncategorized group. That group collects no doc by its key, and the resolver keeps another package's unplaced doc out of Uncategorized.

The book cards' doc counts and the book a doc opens in follow the same answer. Nothing else changes: no export, prop, type member or i18n key is added or removed.
