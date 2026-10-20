---
"@object-ui/fields": patch
---

Lookup quick-picker: the preview line under each option no longer cuts a badge to its first letter (objectui#13123). A column drawn as a badge (a `select`, `status`, `radio`, `multiselect` and the other types the select renderer draws) keeps its whole label. Other columns still truncate their value, but never below their label. A column the line cannot hold is left out whole, together with the columns after it, instead of being squeezed. For example, a showcase Account option on a narrow field used to read "Lifecycle: A. · Industry: Tec... · Annual Revenue: $96,00..." and now reads "Lifecycle: Active · Industry: Technology"; a wider field adds the revenue column back, truncated if it must be.
