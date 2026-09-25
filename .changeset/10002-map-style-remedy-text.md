---
'@object-ui/plugin-map': patch
---

fix(plugin-map): the top-level-`style` warning now prescribes a spelling the runtime reads

`warnOnTopLevelStyleUrl` fires when a map node carries a string `style` — the base
schema's inline-CSS key, which is never read as a map style — and tells the author
where to write it instead. Its last sentence ended "spell it `map: { mapStyle }`
there". `ObjectMapConfigSchema` does not declare `mapStyle`, so neither view
flattener's whitelist carries it and `getMapConfig` never reads it: an author who
obeyed the correction wrote metadata that was discarded a second time, with no
second diagnostic. That text is read at the moment the author is ALREADY being
corrected, which is why prescribing refused metadata there was ruled out for a
sibling sink (objectui#9031).

The remedy now names the declared block — `map: { style: 'URL' }` — on the node
path and on the view path alike. That is also what moved underneath it: since
objectui#9950 both flatteners carry a declared `style` out of `options.map` under
its flat spelling `mapStyle`, so a view's declared block arrives and is read, and
neither producer of an `object-map` node emits a top-level `style` any more. The
sentence had gone on describing the pre-#9950 transport.

⛔ The remedy is no longer defended by a string assertion — that is how it rotted
in the first place, green the whole time because nothing executed it. Every key it
prescribes inside a `map` block is now parsed out of the warning the component
really emits and written into a real `map` block, measured end to end through the
declared block and through the real `ListView` flatten, so the sentence and the
runtime cannot drift apart without a test going red.
