---
'@object-ui/plugin-calendar': minor
---

A standalone `object-calendar` honours `navigation: { mode: 'page' }`, and a `navigation` block written without `mode`, by opening the record page (objectui#11293).

An event click under either spelling used to open nothing on a calendar no parent view navigates for, and the `navigation` input description of the `object-calendar` and `calendar` registrations warned about it. The shared `useNavigationOverlay` now hands that click to the record navigator the host publishes, and the console publishes one on its custom pages, record pages and list views. The description drops the warning and says where `page` goes: through the host's record navigator, and nowhere under a host that publishes none. An overlay mode still keeps the click from a parent view's handlers, and any other mode still hands it to them.
