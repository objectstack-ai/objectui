---
'@object-ui/plugin-detail': patch
---

A currency field's fixed currency, declared as `currencyConfig`, shows on the record quick-look panel and in related lists (objectui#12242).

`@objectstack/spec`'s `FieldSchema` refuses a field-level `currency`, so `currencyConfig: { currencyMode: 'fixed', defaultCurrency }` is the only way a spec object can say an amount is in euros. The record page's sections already carried it to the cell. `RecordDetailPanel`'s field build and `RelatedList`'s cell bag copied `currency` and dropped `currencyConfig`, so on those two surfaces a fixed-EUR amount read in the tenant's currency, or as a bare number when the tenant has none.

- FROM `currency` copied alone → TO `currency` and `currencyConfig` copied, so the cell resolves the currency the way every other currency cell does.
