---
'@object-ui/app-shell': patch
---

The permission-set editor's read-only badge now names the caller's capability when that is the gate that closed (objectui#13011).

A caller who is not walled and does not hold `manage_metadata`, opening a permission set on a type whose runtime write channel is open (the stock `permission` type), saw the badge "Read-only (this metadata type has no runtime write channel)". That was false: the type has a write channel, and this caller may not use it. The banner above the matrix already gave the capability reason, so the page showed two contradictory reasons.

The badge now reads "Read-only (requires the `manage_metadata` capability)", and its hint is the banner's own sentence. The other reasons keep their wording and their order: a read-only package, the tenancy wall, a set a code package ships, and a type with no runtime write channel at all.

Nothing is added to the package entry: no export, prop or type member. One designer-table string is added, `perm.readOnly.capability`, in English and Chinese; no language-pack key is added.
