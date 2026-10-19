---
"@object-ui/app-shell": patch
"@object-ui/data-objectstack": patch
---

One page open asks the server for one object document once (objectui#13044). The metadata provider's by-name object read now goes through the adapter's `getObjectSchema`, so the page's object scope and the record form, `useSettledSchema` and the field widgets share one `GET /meta/object/NAME`. The published view list (`GET /meta/view`) is shared while a request is on the wire: the provider's eager view read, `listViews` and `listViewOverrides` join it instead of each sending its own, and nothing is stored, so a later read, a refresh or a view write still asks the server. An organization or session switch clears the adapter's metadata cache. Each reader still gets its own copy, in the shape it got before; the draft-preview path is unchanged.
