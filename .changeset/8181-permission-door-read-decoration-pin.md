---
---

Pin the permission door's package save against the framework's read decorations
(objectui#8181). The inline `stripReadDecorations` at
`PermissionMatrixEditor`'s draft unwrap was the one strip in the sweep that no
test asserted — measured by removing it, which turned nothing red. Test only;
no package is released by this change.
