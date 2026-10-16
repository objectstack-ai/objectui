---
'@object-ui/plugin-map': patch
---

A map view in a browser without WebGL2 shows its own "Map failed to load" alert and lists its records, instead of crashing the page (objectui#11819).

MapLibre draws only through WebGL2. Without it — hardware acceleration turned off, a GPU-blocklisted browser, some remote desktops, headless Chromium — the page body was replaced by the render-failure card *Component "object-map" failed to render — Cannot read properties of undefined (reading 'destroy')*, which names neither the map nor the cause. `ObjectMap` now asks the browser for a WebGL2 context before it mounts the map. When there is none it never constructs a map: it shows the amber "Map failed to load" alert, naming WebGL2, and lists the records the markers would have drawn. The search box above narrows that list, and choosing a record does what clicking its marker does. A style or tile failure is unchanged: the map keeps running with its markers and shows the alert over them.

Nothing is added to the package entry: no export, prop or type member.
