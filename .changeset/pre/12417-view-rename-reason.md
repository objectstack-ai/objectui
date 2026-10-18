---
'@object-ui/app-shell': patch
---

A refused "Rename view" now says why (objectui#12417). The object page's view tabs showed only the translated "Rename failed" title for any refusal, and the server's reason reached the browser console alone. The toast now carries the server's sentence as its description, through the same channel the view saves (objectui#11583) and "Delete view" (objectui#12398) use, for example a permission refusal. The title is unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
