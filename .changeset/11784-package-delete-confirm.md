---
'@object-ui/app-shell': patch
---

The package sheet's Delete, Discard changes and Duplicate ask in-app before they act, Cancel on Delete deletes nothing, and Studio returns to its landing after the open package is deleted (objectui#11784).

Delete app used to ask two browser confirms in a row, and the second one's Cancel still deleted the
package's structure, keeping only its records. It now opens one dialog: the author picks "Delete the
structure, keep the records" or "Delete the structure and the data" (nothing is preselected), types
the package's name, and only then is the delete button enabled. Cancel, at any point, sends no
request. "Keep the records" sends the delete with `?keepData=true`, as before; the other choice
also drops the object tables.

After deleting the package that is open in Studio, Studio now returns to its landing (`/studio`),
where the next package can be picked or a new one created. It used to open whichever package the
list started with. With no package left at all it still goes to the home page, as before. The
console's Packages page is unchanged: a delete there reloads the list in place.

Discard changes (N) used to discard every pending draft at once. It now asks first, naming the count.

Duplicate used to ask for the new package id in a browser prompt. It now opens the same inline form
the Studio landing uses: a name and a package id, checked by the same package-id rule, with the
Create copy button disabled until the id is valid. A duplicate that the server reports as not done is
now shown as an error rather than as "Package duplicated".

None of the three uses a browser dialog any more, so they also work inside an embedded frame, where
those dialogs are blocked or answered automatically.
