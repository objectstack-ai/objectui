---
'@object-ui/plugin-designer': patch
'@object-ui/i18n': patch
---

fix(plugin-designer): the Navigation Designer has an entry for the spec's `doc` navigation item type

objectstack#19789 added a `doc` member to the spec's navigation item union (an
item that targets a book and/or a doc). `NAV_TYPE_META` in `NavigationDesigner`
is keyed by that spec-derived union, so objectui stopped compiling against
`@objectstack/spec` built from objectstack `main`, and every row reads its badge,
colour and icon from that map. The map now has a `doc` entry (a `BookOpen` icon,
its own colour and the `appDesigner.navTypeDoc` label key). The key has an
English fallback in the designer's defaults and a translation in all ten locale
packs.

The map is typed `Record<NavigationItemType | 'doc', ...>` so it compiles both
against the pinned `@objectstack/spec`, which predates `doc`, and against
objectstack `main`. The `| 'doc'` goes away at the pin bump that ships `doc`.
`doc` is not added to the quick-add buttons: an empty `doc` item fails the spec's
book-or-doc requirement, and authoring one is objectui#10188.
