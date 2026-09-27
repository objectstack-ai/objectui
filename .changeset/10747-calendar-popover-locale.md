---
'@object-ui/plugin-calendar': patch
---

fix(plugin-calendar): `CalendarView`'s header date popover reads the same locale as its grids (objectui#10747)

`CalendarView` formats its header and its month, week and day grids with one
locale: an explicit `locale` (an `object-calendar` node's authored `locale`
arrives this way), else the display locale. The header's date popover mounted
`Calendar` with no locale, so it read the display locale even when the grids
read another one. Under an `en-US` display locale with `locale: 'de-CH'`, the
header read `März 2020` and the popover under it read `March 2020` over
`Su Mo Tu …`.

The popover now passes its grids' locale to `Calendar` as `localeTag`, so both
faces read `März 2020`, and the popover's week starts on Monday. With no
`locale`, both read the display locale, as before. This package takes no
date-fns dependency: the tag is resolved inside `@object-ui/components`.
