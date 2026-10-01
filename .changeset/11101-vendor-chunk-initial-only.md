---
'@object-ui/console': patch
---

perf(console): the first screen no longer downloads the spec entries only the metadata designers' validation uses

The metadata designers' client validation loads each metadata type's spec schema through
`import()`, so `@objectstack/spec`'s `/ai` and `/integration` entries were meant to arrive
only when a designer validates an agent, tool, skill or connector draft. They arrived on
every page load instead: the `vendor-objectstack` chunk group claimed them, and that chunk
is a static import of the console entry. The group now claims only the entry's static
closure (`tags: ['$initial']`), so those two entries — and `/contracts` and
`@objectstack/sdui-parser`, which only lazy code reaches — load with the code that needs
them. Nothing the first screen runs moved, and validation answers exactly as before once
loaded. The console performance budget's ceiling comes down by the bytes recovered
(objectui#11101).
