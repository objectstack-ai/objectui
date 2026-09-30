---
'@object-ui/plugin-chatbot': minor
---

feat(plugin-chatbot): `ChatbotEnhanced` takes an optional `surfaceContextTitle`, the tooltip of the surface-context chip

The chip that `surfaceContextLabel` renders above the composer now accepts an
optional `surfaceContextTitle`, rendered as the chip's `title`. A host can show
a readable label on the chip and keep an internal identifier reachable on hover.
The prop is additive: a caller that does not pass it renders the chip exactly
as before, with no `title`.
