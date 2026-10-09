---
'@object-ui/plugin-list': patch
'@object-ui/plugin-chatbot': patch
---

Three more controls pick with the shared `Select`, the control the rest of the console picks with (objectui#11865, the list view and the chatbot): `ListView`'s "Color by field" and its "Rows per page" selector (the fallback for views without a grid pager), and `ChatbotEnhanced`'s model picker.

The three were browser-native selects, so they looked and behaved differently from the console's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour. "Color by field" now matches its twin in the compact toolbar's View settings popover, which made the same change earlier.

What they write is unchanged. Each option gives the same value as before: "None" still clears the row-colour config, a field keeps the config's colours, each page size still reaches `onPageSizeChange` and refetches at that size, and each model still reaches `onModelChange` as its id. Re-picking the current option writes nothing. The model picker keeps its accessible name, the `model` label. A row-colour rule on a field the caller may not read still shows as "None" and is never offered.

One display change: a value none of a picker's options carries now shows as itself. The native select showed its first option instead: "None" for a row-colour field outside the list's columns, the first size for a page size in force that is not one of the options (an undeclared size, for instance), and the first model for a selected model the environment no longer offers.

**Clause-②: no.** No published face moves: the package entries export the same names, the two components take the same props, and no i18n key is added. What moves is the three controls' own markup, described above.
