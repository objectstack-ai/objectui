---
'@object-ui/plugin-designer': patch
---

chore(plugin-designer): the app creation wizard calls `resolveNavItemLabel` with its new signature (objectui#11299)

`@object-ui/layout` removed the three unused resolver arguments of
`resolveNavItemLabel`, so the wizard's preview of an unlabelled navigation entry now
calls it as `resolveNavItemLabel(item, undefined, targetLabel)`. What the wizard shows
is unchanged.
