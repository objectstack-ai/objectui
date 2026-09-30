---
'@object-ui/app-shell': patch
---

fix(app-shell): the permission editor's row-level-security policy list draws each policy's label and description

A row-level-security policy may declare a `label` and a `description` (plain
optional strings on `@objectstack/spec`'s `RowLevelSecurityPolicy`). The server
stores and serves both, but no Studio screen drew them: the permission edit page
(`PermissionMatrixEditPage`) mounts no preview, and its policy list,
`PermissionAdvancedFacets`, showed only each policy's name, object, operation,
enabled switch and predicates. `PermissionPreview` draws both keys, but no
production route mounts it for `permission`.

Each policy card in the Row-Level Security section now heads its inputs with the
policy's label and, beneath it, its description, verbatim. A policy that declares
neither, or declares them empty, renders exactly the card it rendered before.
Nothing new is authored: the two keys are drawn, not edited, and every write path
already spread the whole policy, so an edit carries both back out unchanged.
