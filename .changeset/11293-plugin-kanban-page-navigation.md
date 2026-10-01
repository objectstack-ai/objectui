---
'@object-ui/plugin-kanban': minor
---

A standalone `object-kanban` honours `navigation: { mode: 'page' }`, and a `navigation` block written without `mode`, by opening the record page (objectui#11293).

A card click under either spelling used to open nothing on a board no parent view navigates for, and the `navigation` input description warned about it. The shared `useNavigationOverlay` now hands that click to the record navigator the host publishes, and the console publishes one on its custom pages, record pages and list views. The registration's `navigation` description drops the warning and says where `page` goes: through the host's record navigator, and nowhere under a host that publishes none. A parent view's click handler still outranks the whole key.
