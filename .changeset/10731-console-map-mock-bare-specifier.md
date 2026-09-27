---
---

Test and devDependency only, no package released: `apps/console`'s filter-context-token sweep
(`filterContextTokensSweep-10666.test.tsx`) mocks `react-map-gl/maplibre` by its bare specifier,
and `@object-ui/console` declares `react-map-gl` as a devDependency at `plugin-map`'s range so
that specifier resolves from the app to the same store instance `plugin-map` imports. The previous
mock named a relative path into `packages/plugin-map/node_modules`, which exists only after
install, so the pre-install `Inert vi.mock Specifier Check` read it as resolving to no file and
`main` went red (objectui#10731). Nothing under `dist/` or `plugin.js` changes.
