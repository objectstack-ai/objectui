---
'@object-ui/app-shell': patch
---

A rolled-back Studio publish shows its "Nothing was published" banner again (objectui#11985).

When a package publish fails, the server rolls the whole batch back and marks every draft that went down with the failing one with the code `BATCH_ABORTED`. Studio's publish message compared that code to a lower-case `batch_aborted`, so the match never happened: instead of the banner, the cause and a count of the aborted drafts, the author got one parallel line per draft, each sibling reading as if it had failed on its own. Studio's publish toasts and the AI chat page's publish summary now match `BATCH_ABORTED` exactly as the server sends it, so they lead with the banner, name the item that caused the rollback and count the rest. A publish that fails without rolling anything back still lists each failed draft with its own error.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
