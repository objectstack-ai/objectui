---
'@object-ui/app-shell': patch
---

The app bar's Edit app pencil now appears only where Studio can edit: for a metadata author, on an app whose package Studio lists as writable. A read-only package's app (such as a code-shipped package) and the console's own system apps (Setup, Studio, Account) no longer show it, and neither does the app switcher's "Edit app in Studio" row. The sidebar entry menu's Design entry and a page's Edit in studio pencil follow the same rule. While the package list is loading, or if it cannot be read, these entries stay hidden.
