---
'@object-ui/app-shell': patch
---

Studio's Interfaces pillar can now create a page in a writable package, and opens it on its source beside a live preview (objectui#11823, step 3).

The **New** menu beside the navigation rail offers *New page* after *New dashboard* and *New report*.
It opens the shared create dialog (a name, and the identifier derived from it) with one more choice,
the language the page is written in:

- **HTML** (the default): built from the platform's components and HTML tags, parsed and never run;
- **React**: real React code, run when the page renders. It is offered only where the deployment runs
  React pages (a deployment can turn them off).

On save:

- the page is saved as a draft in the package: an app page (a page the app's navigation can open) of
  the chosen kind, starting from a short source with one line of text;
- an entry linking it, carrying the name typed in the dialog, is added to the app's navigation and
  saved with it, so it appears in the rail at once;
- the page opens with its source in the code editor on the right and the live preview, drawn by the
  same renderer the running app uses, on the canvas.

An identifier that another page already holds, published in any package or as a draft, is refused in
the dialog and nothing is saved. As for dashboards and reports, the menu is not offered on a read-only
package, on a package with no app yet, or while the navigation is being edited.
