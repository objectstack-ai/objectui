---
'@object-ui/types': patch
---

The published `ViewNavigationConfig` docblock no longer teaches the retired
`navigation.view` key (objectui#9938). Its example of `mode` being optional on the
authoring side used `navigation: { view: 'summary_view' }`; `view.list.navigation.view`
was removed in `@objectstack/spec` 17.5.0 under ADR-0049, so the example now uses
`navigation: { openNewTab: true }`, a spelling the spec's `NavigationConfigSchema`
accepts both on the installed 17.4.0 and after the removal. Comment-only: no type,
export or runtime behaviour changed; the docblock ships in the package's `.d.ts`.
