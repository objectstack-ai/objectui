---
'@object-ui/components': patch
---

The list Group panel picks its field with the shared `Select`, the control the Filter and Sort panels beside it pick a field with (objectui#11865, the Group panel's part of that card).

`GroupingEditor` drew each grouping level's field picker as a browser-native select, so it looked and behaved differently from the Filter and Sort panels next to it. It now uses the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What it writes is unchanged. Picking a field changes only that level's `field`, and `onChange` receives the same `{ fields: [...] }` value as before, key for key. Each level still lists its own field plus the fields no other level uses, in the order of `fieldOptions`. The order toggle, the "collapsed by default" checkbox, the remove button and the add button are unchanged, and removing the last level still passes `undefined`.

One display change: a level grouped by a field that `fieldOptions` does not list now shows that field's name in its picker. This happens when a view is grouped by a column it does not show. The native select showed the first listed field instead, which was not the field the list was grouped by.

**Clause-②: no.** Nothing on the package entry changes. `GroupingEditorProps` and the exports of `@object-ui/components` are unchanged, and no i18n key is added.
