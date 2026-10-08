---
'@object-ui/app-shell': patch
---

Studio's Interfaces rail draws a separator as a divider and shows a navigation item's badge, as the running app's sidebar does (objectui#11791).

- **Separator.** A `separator` entry used to show in the rail as a greyed, unlabeled row with a generic icon. It is now a thin rule between the rows around it. It cannot be clicked, the keyboard skips it, and a screen reader does not announce it, which is how the app's sidebar treats it.
- **Badge.** An entry's `badge` was not shown in the rail. It is now a pill after the entry's label, in the entry's `badgeVariant`, or in the default style when none is set, the same pill the sidebar draws. A badge of `0` is shown too, as the sidebar shows it. An entry that opens no design surface, such as a URL, keeps its badge on its disabled row. A group heading shows no badge, as in the sidebar.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
