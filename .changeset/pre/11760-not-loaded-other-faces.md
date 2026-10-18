---
'@object-ui/app-shell': patch
---

The package Details page and the marketplace catalog read a package this runtime refused to load as not loaded, not as installed (objectui#11760, following objectui#11645).

After a restart whose startup refused a package (for example one that targets a protocol this runtime does not support), the install-local listing marks it `notLoaded` (`@objectstack/*` 17.7.0). Installed Apps reads that marker since objectui#11645. Three other places still said such a package was installed and running:

- **Details header.** It drew the green "Installed · vX" badge. It now draws the installed version and a "Not loaded" badge, with the reason beneath, in the catalog view and in the view an offline runtime draws.
- **Details' own Uninstall.** It confirmed and reported that the app stays loaded in the running kernel until the next restart. It now uses the texts Installed Apps uses for the same entry: nothing of the package is running, and no restart is needed.
- **The catalog.** A catalog card drew "Installed vX", and a "Your organization" card drew "Installed". Both now draw "Not loaded", and the catalog card keeps the installed version beside it.

A loaded package renders as before on every face. Nothing is added to the package entry: no export, prop, type member or language-pack key. The texts are the ones objectui#11645 added.
