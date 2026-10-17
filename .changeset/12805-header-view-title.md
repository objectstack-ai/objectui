---
'@object-ui/app-shell': patch
---

The app header titles a view stored with no `label` by its object's plural label, the name its tab shows (objectui#12805).

On a `/apps/APP/OBJECT/view/NAME` route, a view with no `label` and no `title` was titled by its humanized name: "Default" for `/view/default`, "Recheck Gate.Default" for `/view/recheck_gate.default`. Its tab already read the object's plural label (objectui#12774), so the header and the tab named the same view two ways. The header now reads the same function the tab reads. A view with a `label` keeps it, and a view with a `title` and no `label` keeps the `title`.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
