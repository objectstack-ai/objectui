---
'@object-ui/app-shell': patch
---

Studio's New package dialog no longer calls the package "project-scoped" (objectui#13126). ObjectStack renamed project to environment (ObjectStack ADR-0006), and the dialog is not environment-scoped either, so the description now reads "Create a writable package to author and publish your own metadata." (zh: 创建可写的软件包，用来编写和发布你自己的元数据。), followed by the unchanged reverse-domain id hint.

Nothing is added to the package entry: no export, prop, type member or language-pack key. Only the existing `engine.packages.create.description` row of the metadata-admin designer's string tables (en and zh) changes.
