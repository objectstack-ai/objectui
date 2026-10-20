---
'@object-ui/app-shell': patch
---

Home's pending-drafts row names the package its drafts share by the name Studio shows for it, not by its id (objectui#13136).

The row read "2 unpublished changes · Visit Created, Visit Readers waiting to publish in com.default.ux-walk-pkg" where Studio's top bar names the same package "UX Walk Pkg". The `_drafts` list carries a draft's package id and no package name, so Home now reads the package list Studio reads (`GET /api/v1/packages`) when every draft is in one package, and names the package by its `name` there. The id still stands in where Studio's top bar shows it: a package that declares no name, a package the list does not carry, and a list that cannot be read. Until the list answers, the row names no package rather than show the id first.

Nothing is added to the package entry: no export, prop, type member or language-pack key, and the `home.pendingDrafts.inPackage` text is unchanged.
