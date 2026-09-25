---
'@object-ui/console': patch
---

API Console's endpoint catalog is keyed by the canonical `storage` service slot, and reads
only that slot (objectui#5291, framework#9683).

`useApiDiscovery`'s `SERVICE_ENDPOINT_CATALOG` looks its keys up directly in `/discovery`'s
`services` map, and that lookup is deliberately fail-closed (ADR-0076 D12). objectui#5286
had kept the Storage entry keyed by the deprecated `file-storage` spelling, with a small
alias table that read `services.storage` first and fell back to `services['file-storage']`,
because the installed `@objectstack/spec` did not list `storage` in `CoreServiceName` yet.
It does now, so the entry is re-keyed to `storage`, and the alias table
(`DEPRECATED_SERVICE_SLOT_ALIASES`) and the special case in the discovery lookup are removed.

Against a backend that reports the slot under `storage` — every framework release that
carries the framework#9683 mirror, which also copies the row under `file-storage` — the page
renders the same Storage group as before. Two behaviours change:

- A backend older than that mirror reports `file-storage` alone, and there the Storage group
  is now hidden, like any other slot missing from `/discovery`.
- When the `storage` service row carries no `route`, the group now takes its route prefix
  from `routes.storage` in the discovery payload before falling back to `/api/v1/storage`.
  The old `file-storage` key never matched that route-map key.
