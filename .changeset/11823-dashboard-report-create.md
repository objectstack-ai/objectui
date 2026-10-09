---
'@object-ui/app-shell': patch
---

Studio's Interfaces pillar can now create a dashboard or a report in a writable package (objectui#11823, step 2).

A **New** menu beside the navigation rail offers *New dashboard* and *New report*. Each opens the
shared create dialog (a name, and the identifier derived from it), and on save:

- the item is saved as a draft in the package: a dashboard with no widget yet, and a report bound
  to the dataset and the measure the dialog asks for, since a report must name a dataset and at
  least one of its measures;
- an entry linking it is added to the app's navigation and saved with it, so it appears in the
  rail at once. A dashboard entry carries no label and shows the dashboard's own; a report entry
  carries the name typed in the dialog, since a report entry does not take its report's label;
- the new item opens on its canvas in design mode: the dashboard canvas with "Add widget", or the
  report canvas with its Properties panel.

An identifier that another dashboard or report already holds, published in any package or as a
draft, is refused in the dialog and nothing is saved. The menu is not offered on a read-only
package, on a package with no app yet, or while the navigation is being edited.
