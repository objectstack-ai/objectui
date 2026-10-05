---
'@object-ui/app-shell': patch
---

The External Datasource panel in Setup and Studio reads the `{ success, data }` envelope its routes answer (objectui#11628). On a federated datasource such as the showcase's `showcase_external`, the Tables tab listed no remote tables. "Refresh catalog" showed no snapshot time, and "Run validation" replaced the panel with a render error (`Cannot read properties of undefined (reading 'length')`). Because the list was empty, the import dialog could not be opened. The client read `tables`, `draft`, `catalog` and the validation verdict from the top of the body, but the server puts each one under `data`. The panel now lists the remote tables, shows the snapshot time after a refresh, renders the validation rows, and opens the import dialog on the generated draft.

Refusals on these routes now reach the user. Every refusal used to read `[object Object]`, because the client turned the ADR-0112 `{ error: { code, message } }` object into a string. That covered a missing capability, an unknown remote table, an unreachable datasource, and a capability refusal from "Import as Object". The panel now shows the server's message and code. The "federation is not enabled on this server" hint now appears when the server answers `503 SERVICE_UNAVAILABLE`. Before, it never did, because the client compared against a code the server no longer sends.

A successful response that is not the `{ success: true, data }` envelope is now an error that names the route. Before, the panel showed it as an empty list.

**Clause-②: no.** Nothing is added to or removed from the package entry. The changed module is not exported from it.
