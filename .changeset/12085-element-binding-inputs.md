---
'@object-ui/components': minor
---

`element:repeater` and `element:number` publish the node-level `dataSource` binding as their only query input (objectui#12085). `@objectstack/spec` retires the element layer's flat binding keys as tombstones (objectstack#11509, objectstack PR #22421), and the repeater's registration still required a flat `object`, so the html-page validator refused a repeater bound through `dataSource` alone and accepted the spelling the spec retires.

**Narrowing, no widening.** The `element:repeater` registration drops its `object` (which was `required: true`), `filter`, `sort` and `limit` inputs. The `element:number` registration drops its `object` and `filter` inputs, which the metric has not read since objectui#11880. The injected `dataSource` input is unchanged on both. In the manifest these registrations feed, a repeater bound only through `dataSource` now draws no diagnostic (it drew `missing-required-prop`), and each of those six flat keys now draws `unknown-prop`. No export is added or removed, and no input is added.

**Rendering is unchanged.** The repeater still reads its flat `properties.object` / `filter` / `sort` / `limit` as the binding's fallback, for metadata written before the retirement. That read is not published as an authoring surface. The metric reads its query from `dataSource` only, as before.

objectstack's `sdui.manifest.json` is regenerated from these registrations at objectstack's next console pin bump; this release does not change that file.
