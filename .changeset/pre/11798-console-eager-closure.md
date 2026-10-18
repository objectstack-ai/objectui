---
'@object-ui/console': patch
---

The console's first page load no longer downloads the Studio builder or the chart engine (objectui#11798).

- **Studio loads with its route.** `StudioDesignSurface` and `BuilderLanding`, and the modules only they use (the pillar panels and the form designer), were in the bundle every console page fetched before it rendered, for every user, including the many who can never enter Studio. They now load when a Studio screen is first opened: the `/studio` routes and the `studio:builder` app component both reach them through a console-local module that nothing imports statically. The Studio entry gate is unchanged and still decides first, so a principal without `studio.access` never downloads the builder. While the builder loads, the full-screen pillar builder shows the console's loading splash, and the `/studio` landing and the `studio:builder` entry show a loading line inside their frame, announced to assistive technology as a status.
- **Charts load with the first chart.** Recharts and d3 were already imported only on demand, but the console's `vendor-charts` chunk group also claimed their dependencies, among them `use-sync-external-store`, a small React shim that the translation runtime imports on every page. That one shared module made the whole chart engine part of the first page load. The `vendor-react` group now owns the shim, so the chart chunk holds nothing the first page needs and loads when the first chart renders.

The flow designer's canvas is unchanged here: `@object-ui/app-shell` registers its metadata designers, the flow canvas among them, when the package loads, so the console cannot defer it.

Nothing is added to or removed from any package entry, and no route, registry key or translation key changes.
