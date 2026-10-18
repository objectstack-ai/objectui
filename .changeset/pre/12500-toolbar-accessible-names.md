---
'@object-ui/plugin-list': patch
'@object-ui/i18n': patch
---

List toolbar: the Filter, Export and Add record buttons keep an accessible name when they render icon-only below the `sm` breakpoint (objectui#12500). Each carries an `aria-label` from the same i18n key as its visible label. With filters active, the Filter button's name carries the count through the new `list.filterActive` key ("Filter, {{count}} active"), added to all ten locale packs.
