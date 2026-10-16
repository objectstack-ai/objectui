---
'@object-ui/app-shell': patch
'@object-ui/data-objectstack': minor
---

Studio's Automations rail and the open flow's Status pill read the automation engine's registration verdict, which the flow list now serves beside its items (`registrations`, `FlowRegistrationSchema` in `@objectstack/spec`). A flow the engine refused at boot reads "Refused by the engine", titled with the engine's message as sent, instead of "Unpublished draft" or "Enabled"; a flow the engine holds no registration for reads "Not running here". A registered flow, and a flow with no verdict, read as before, and the flow's stored `status` is never rewritten. `MetadataClient.listResponse` returns a list read with what the server serves beside the items; `list` is unchanged.

**Clause-②: yes (widening).** `@object-ui/data-objectstack` gains one method, `MetadataClient.listResponse`, and one exported type, `MetadataListAnswer` (`items` plus the optional `registrations` of the spec's `GetMetaItemsResponse`). No export, prop or member is removed or changes type; `@object-ui/app-shell`'s exports are unchanged.
