---
'@object-ui/plugin-report': minor
---

Report display sites follow the display locale instead of the literal tag `en-US`
(objectui#10020).

Five display paths in this package handed `Intl` the literal BCP-47 tag `en-US` —
four branches of `formatValue` (`currency` / `currency_cny`, `currency_usd`,
`percent`, and the default thousand-separated branch) and the Excel cell formatter
behind `exportExcelWithFormulas`. That is the exact tag `useDisplayLocale`'s contract
in `@object-ui/i18n` names as the wrong answer, in as many words: *"Note this is
`'en'`, not `'en-US'`: the point of objectui#4033 is that `en-US` is not the world's
default."* A tenant that had configured `de-DE`, or a user reading the console in
Chinese, saw US grouping and decimal marks regardless — while the same package already
resolved that channel three times in `DatasetReportRenderer`.

**Additive, not breaking.** `formatValue` is a published export, so its new display
locale is an OPTIONAL third parameter and `exportExcelWithFormulas` takes an optional
`locale` on the options bag it already had. Every call that compiled before compiles
after, and omitting the argument formats in `'en'` — the display channel's own last
resort, which is neither `en-US` nor an absent tag.

**What that means for callers.** An optional parameter nobody passes would be the same
defect with a longer signature, so `ReportViewer` now resolves `useDisplayLocale()`
itself and threads it at all three of its call sites. If you call `formatValue` or
`exportExcelWithFormulas` from your own code, pass the locale you render in —
`useDisplayLocale()` in React, and for a non-React caller the tag your session
resolved. `exportExcelWithFormulas` cannot read the channel itself: it is not a
component, and a display locale is a property of the session rather than of the
authored report schema, so its caller is the only place the tag can come from.

Threading a tag also introduces a hazard a literal never had — a tenant-configured tag
can be malformed (`en_US`, underscore instead of hyphen, makes `Intl` throw
`RangeError`), and these calls sit inside a cell render. A malformed tag now degrades
to the same last resort rather than taking the report down. It deliberately does NOT
degrade to a dropped tag, which would mean the machine's locale — the separate defect
shape tracked on objectui#9909, still present in this package's HTML export header and
deliberately not merged into this change.
