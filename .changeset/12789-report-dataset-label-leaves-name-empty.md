---
'@object-ui/app-shell': patch
---

A new report's or dataset's Label in a non-Latin script no longer names it `field` (objectui#12789). The report and dataset designers derive the Name from the Label until you type a Name yourself. When the Label held no Latin letters or digits (for example `收入`), or was cleared, that derivation wrote the placeholder `field`, so the item was silently named `field` and a second one collided with the first.

Such a Label now leaves the Name empty, as the object designer already does, and saving asks you for a name ("A name is required."). A Name left empty this way still follows a Latin Label typed later. A Label that yields a name derives exactly what it derived before. An existing report's or dataset's name is unchanged and still not editable.

Nothing is added to or removed from the package entry: no export, prop or type changes.
