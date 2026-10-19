---
"@object-ui/app-shell": patch
"@object-ui/data-objectstack": patch
---

One page open asks the server for one metadata URL once (objectui#13044). The metadata provider's by-name object read now goes through the adapter's `getObjectSchema`, so the page's object scope and the record form, `useSettledSchema` and the field widgets share one `GET /meta/object/NAME`. The published view list (`GET /meta/view`) is shared the same way by the provider's eager view read, `listViews` and `listViewOverrides`. Each reader still gets its own copy, in the shape it got before; an invalidation, a view write and the draft-preview path still ask the server.
