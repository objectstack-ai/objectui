---
'@object-ui/layout': patch
---

fix(layout): the mobile tab bar draws its tabs in the sidebar's order, and shows an entry's badge

`AppSchemaRenderer` with `mobileNavMode: 'bottom_nav'` drew its tab bar in authored
position and never read `order`. Two entries written `Zeta` (`order: 2`) then
`Ypsilon` (`order: 1`) came out `Ypsilon, Zeta` in the sidebar and `Zeta, Ypsilon` on
the bar. With more than five entries, the five-tab cap kept the first five by authored
position rather than the five the sidebar lists first.

The bar now sorts each level with the sidebar's own comparator before it flattens:
first the top level, then each group's children. The guard and the five-tab cap run
after the sort, so the five tabs are the first five entries the sidebar draws. The
comparator lives in one internal module, and the sidebar's two sort sites use it too.
It is not exported, so the package's public API does not change. An entry with no
`order` still sorts as `0`, and entries with equal `order` keep their authored order,
as in the sidebar before.

The bar also dropped an entry's `badge` and `badgeVariant`. It now draws them on the
tab with the same `Badge` component and the same variant the sidebar row uses.
