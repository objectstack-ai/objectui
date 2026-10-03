---
'@object-ui/create-plugin': patch
---

The generated plugin's `jsdom` devDependency is now `^29.1.1` instead of
`^30.0.1` (objectui#11366).

jsdom 30 declares `engines.node` as `^22.22.2 || ^24.15.0 || >=26.0.0`, so on
the Node 22 line a scaffolded plugin's test stack needed 22.22.2 or later, and
an install with `engine-strict=true` refused every earlier 22.x release. jsdom
29.1.x declares `^20.19.0 || ^22.13.0 || >=24.0.0`, which brings that floor down
to 22.13. The generated `vite.config.ts` still runs the example test with
`environment: 'jsdom'`, and no other generated file changes.

The range is copied from this repository's root manifest, which is the anchor
`templates.test.ts` holds the scaffold to. The root moves to the same jsdom line
in this change, and its `engines.node` floor becomes `>=22.13`, the highest
lower bound the locked dependencies set on the 22 line. The root package is
private, so that half needs no changeset of its own.
