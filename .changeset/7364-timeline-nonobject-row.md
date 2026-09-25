---
'@object-ui/plugin-timeline': patch
---

Gantt: a row that is not an object is now refused instead of drawn as an empty,
unlabelled row (objectui#7364). `items: [0]`, `items: ['x']`, `items: [true]`
and `items: [[]]` used to render a blank row with no word to the author, while
`validate` already refused every one of them at authoring time. The renderer now
agrees with `validate`: the chart shows the existing
`timeline.gantt.unusableRange.malformedRow` diagnostic, naming the row's path
and value (for example `items[0] is 0, which is not a row shape`). No new i18n
key and no locale pack change. Well-formed object rows, a row with no `items`
key and a row whose `items` is `null` draw exactly as before.
