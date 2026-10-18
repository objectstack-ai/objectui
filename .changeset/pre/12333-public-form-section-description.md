---
'@object-ui/console': patch
---

The public form `/f/:slug` shows each section's description under its heading, as served (objectui#12333).

Clause-②: no

A signed-out visitor's console loads no app translation bundle (objectui#12034), so the public form is localized by the server: since objectstack-ai/objectstack#23497 (`@objectstack/*` 18.0.0-next.3), `GET /api/v1/forms/:slug` serves each section's `label` and `description` in the `Accept-Language` the browser sends. The heading already rendered the served label. The description was dropped before render, in every language, while `ObjectForm` draws the same key on the signed-in app path. It now renders under the heading, as served, with no client-side lookup.

No prop, export or locale key changes.
