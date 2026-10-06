---
'@object-ui/fields': minor
'@object-ui/plugin-detail': minor
'@object-ui/plugin-grid': minor
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Read-only boolean values, the boolean list face and the Home greeting's punctuation follow the language (objectui#11689).

Under zh-CN a record showed its boolean values as "Yes" / "No", and the Home greeting joined a Chinese greeting to the person's name with an ASCII comma and closed it with an ASCII period.

- **Booleans.** The read-only surfaces that draw a boolean as a word now read the existing `common.yes` / `common.no` keys: `BooleanField`'s readonly display, a `FormulaField` whose `returnType` is `boolean`, the lookup column's plain-text fallback, and the record-detail highlights chip. zh-CN shows the Chinese words; English is unchanged. Without an `I18nProvider` the words stay "Yes" / "No".
- **The boolean list face.** `BooleanCellRenderer`, which every list surface draws, spelled its status badge ("Active — Off") and its completion indicator's accessible names ("Completed" / "Not completed") in English. All three now come from the language packs. The grid also handed that face the authored field label while its header printed the translated one, so the badge named the column in the authored language under a translated header. The face now receives the label the header prints.
- **Greeting.** The comma before the name and the closing mark are two new keys, so zh-CN reads the full-width comma and full stop, Japanese its own marks and Arabic its own comma. English is unchanged, and the name keeps its own colour.

**Widened public surface.**

- `@object-ui/i18n`: five new keys in all ten language packs, so the exported `en` pack and the `TranslationKeys` type derived from it gain `home.greetingSeparator`, `home.greetingEnd`, `fields.boolean.offBadge`, `fields.boolean.completed` and `fields.boolean.notCompleted`.
- `@object-ui/fields`: a new export, `useBooleanValueLabel()`, with its type `BooleanValueLabel`. It returns the current language's word for a boolean value, and `@object-ui/plugin-detail`'s highlights chip reads it.
