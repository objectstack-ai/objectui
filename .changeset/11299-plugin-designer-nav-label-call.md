---
'@object-ui/plugin-designer': patch
---

chore(plugin-designer): follow `@object-ui/layout`'s and `@object-ui/types`' navigation label changes (objectui#11299)

- `@object-ui/layout` removed the three unused resolver arguments of
  `resolveNavItemLabel`, so the app creation wizard's preview of an unlabelled
  navigation entry now calls it as `resolveNavItemLabel(item, undefined, targetLabel)`.
- `@object-ui/types` now types a navigation entry's `label` as the spec's `I18nLabel`
  (a string or an inline locale map), so the navigation designer's inline rename reads
  the label through a helper that takes both: a string, and objectui's keyed
  reference, start the draft as before, and an inline locale map starts it empty, as it
  already did.

What either component shows is unchanged.
