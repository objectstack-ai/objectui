---
'@object-ui/app-shell': minor
'@object-ui/core': patch
---

Setup lists the sharing rules installed packages declare again, read-only, with Disable / Enable and Clone (objectui#12982).

Since objectstack stage 9 a package's declared sharing rules are no longer `sys_sharing_rule` rows, so Setup's Sharing Rules page (that object's data view) stopped listing them while they still granted access. Following objectstack ADR-0131 D6 regime C (ruling A on objectstack#24378), the declared rules now have their own page, the environment scope of the `sharing_rule` registry type (`…/metadata/sharing_rule?scope=environment`), as permission sets and positions do. The `sys_sharing_rule` view stays the page for the rules an organization authors. No page fetches and merges both lists.

- **Read-only, with provenance.** The list shows each rule's object, recipient, access level and declaring package. It offers no New, and a rule opens read-only. A link leads to the organization rules page, where New lives.
- **Disable / Enable.** `sharing_rule` joins the Setup catalog types with an active switch: the state is the activation ledger's row, and the switch writes `POST /security/_activation/sharing_rule/:name`. A refusal, such as a walled tenant's, is shown in the server's words.
- **Clone.** Offered only to a caller holding the create grant on `sys_sharing_rule`, read through the new `declarationClone` row of `AFFORDANCE_GRANTS` (`@object-ui/core`). The dialog pre-fills a new organization rule from the server's compiled projection of that rule (`GET /sharing/rules/:name`), under a name no declared rule holds, and writes it through the `sys_sharing_rule` data door. The server's `409 RESOURCE_CONFLICT` for a declared name is shown as sent. Once the copy exists, the dialog offers to switch the declared rule off. A rule already switched off, whose projection the server does not serve, continues in the pre-filled New form.

Clause-②: no. Console UI over existing server doors; no spec key or registry key changes. `AFFORDANCE_GRANTS` gains one row, `declarationClone`.
