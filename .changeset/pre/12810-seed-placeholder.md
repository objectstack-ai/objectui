---
'@object-ui/app-shell': patch
---

Metadata designer create flows no longer save the spec create seed's placeholder identity. The seed's `label` and its placeholder object binding are taken from the author or not at all, so a dataset created without a base object is no longer saved bound to the seed's placeholder object (whose reads were then refused). A placeholder the type requires and the author left unset — a dataset's base object, or a required label — now refuses Save in the browser with a message naming it, and no request is sent. The seed's structural defaults (for example a dataset's `count` measure) are still carried.
