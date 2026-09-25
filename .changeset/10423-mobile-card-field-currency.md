---
'@object-ui/plugin-grid': patch
---

fix(plugin-grid): the mobile card's amount line reads the field's own currency

`ObjectGrid`'s mobile card summarises the row's amount on one line. That line
resolved its currency from the card's column draft, which carries neither
`currency` nor `currencyConfig`, so it always fell through to the tenant
currency. Under a USD tenant a field fixed to JPY
(`currencyConfig: { currencyMode: 'fixed', defaultCurrency: 'JPY' }`) read `¥`
in the desktop cell and the summary footer (objectui#10354) but `$` on the phone
card of the same row. The line now resolves from the object schema's field def,
the same def the desktop cell reads, on every column shape.
