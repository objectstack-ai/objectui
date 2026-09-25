---
---

Test-only in `@object-ui/console`: a new suite pins that a `FormPage` row whose `type` is a retired field-type spelling (objectui#4814's `owner`) renders the tombstone that refuses it visibly, and no editable control, on both the `/forms/:name` and `/f/:slug` routes (objectui#10176). The behaviour itself shipped with objectui#10457, which moved the page's field switch onto the shared resolver; this change adds only the test, and no package is released by it.
