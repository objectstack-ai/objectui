---
'@object-ui/plugin-detail': patch
---

Format the detail summary chip's currency and date values in the DISPLAY locale
(objectui#9453).

The `summaryFields` chip beside the record H1 passed the literal `undefined` to
`Intl` in four places — the currency branch, its unresolved-currency number
fallback, and both date branches. `useDisplayLocale`'s own doc comment names
that literal as the one thing a caller must not do: `undefined` means the
MACHINE's locale, which is neither the tenant's configured regional default nor
the active UI language. A German tenant therefore read a German date in the list
and an en-US date beside the H1 of the record it opened, for one stored value,
and on an unconfigured workspace the chip agreed with whatever locale the
browser's host happened to have.

All four now read `displayLocale`, the binding this same render already resolved
for the percent branch (objectui#9167), so every family in the chip's format
switch is on one channel.

**Only the locale moved.** The chip's own deliberately compact face — its
rounded currency and number, its medium date style and short time style — is
unchanged, and the `en` readings are byte-identical before and after. Whether a
KPI chip beside a title should instead read exactly like its list cell is an
open question objectui#9453 recorded and did not answer.
