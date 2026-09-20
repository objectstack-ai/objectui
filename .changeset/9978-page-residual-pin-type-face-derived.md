---
---

Pin `normalize-list-view.pageResidual-8429.test.ts` survives the spec retiring the kind it pins (objectui#9978). Test only; no package is released by this change.

The pin stated the TYPE face of `@object-ui/types` inline, as `const pageAsViewType: ViewType = 'page'`. An annotation judges the literal against whichever `ViewType` is RESOLVED, so once objectstack#17063 retired the list-view kind `page` upstream, that line became `TS2322: Type '"page"' is not assignable to type 'ViewType'` against a spec built from objectstack `main` — the pin failing to COMPILE on the leg where the retirement is the news, and one of the two diagnostics objectui#9860's shape gate reports.

⛔ The spelling is not deleted; it is this file's subject. What moves is what it is checked AGAINST, the move objectui#9880 made in the source with `Extract` and objectui#9943 made for the `Record<ViewType, …>` totals. `@object-ui/types` derives its two faces from two different exports of the spec, so the claim the test is named for — `page` on BOTH published faces — is now checked as the two faces AGREEING about it: `never` while they carry it together and while they drop it together, a live union the moment either narrows alone. `page`'s bare presence stays asserted at RUNTIME, against the spec this repository actually resolves, in the sized vocabularies, the `safeParse`, the residual set and the census. Both skew directions and the old annotation are kept in the file as firing controls, so the green can never be the green of a check that stopped checking.
