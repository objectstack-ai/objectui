---
'@object-ui/app-shell': patch
'@object-ui/components': minor
---

A record whose record page declares `print` shows its header actions again (objectui#12906).

- **Console.** A page that declares `print` holds only the printable component types, and `page:header` is not one of them, so such a record page drew none of the record's header actions: no declared `record_header` / `record_more` action, and no Edit / Share / Delete. The record view now draws them in the print page's screen-only chrome row, beside Print. Each is gated, ordered, folded into the `⋯` and dispatched exactly as on any other record page. The row sits outside the print page's root, as Print does, so the print stylesheet hides it on paper. A record page without `print` is unchanged.
- **`@object-ui/components`** exports `PageHeaderActions` (and its props type), `page:header`'s own action row lifted out of `PageHeaderRenderer`. `page:header` draws its actions through it, so the two surfaces share one resolver. It renders inside the record's `RecordContext` and `ActionProvider`.

Clause-②: yes. A new export, `PageHeaderActions` / `PageHeaderActionsProps`, on `@object-ui/components`. No spec key, registry key or printable component type changes.
