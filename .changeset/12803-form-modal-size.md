---
'@object-ui/app-shell': patch
---

The console's create / edit record modal now opens at the size an object's default form view authors in `modalSize` (`sm`, `default`, `lg`, `xl` or `full`). On desktop the authored size wins over the derived default; on a phone the modal stays full-screen. With no `modalSize` authored, the modal sizes itself as before.
