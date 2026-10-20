---
---

No package released: the `@objectstack/*` pin moves to objectstack's 18.0.0 version commit `06cab4849a`, and nothing objectui publishes changes behaviour (objectui#13261).

`.objectstack-sha` and the packed manifests in `.objectstack-pin/` move with it; `pnpm-lock.yaml` does not (the packed manifests declare the same dependency names, and a frozen install accepts the lockfile). The publish floor `scripts/objectstack-floor.mjs` computes at this pin is 18.0.0.

The published sources touched are doc comments only. Sentences that state which `@objectstack/spec` is installed were re-measured against the 18.0.0 build, on the same probes as at the old pin with identical answers, and restamped `18.0.0` (`check:installed-pin-claims`). `tsc` keeps some of those comments in emitted `dist/` files, which are published, but they change no export, type or behaviour, so they release nothing and ship with the next release of the group.

The tests that moved with the pin follow the spec's retirement of the list view's `filterableFields` (objectstack#24640), whose reader objectui#13118 had already removed: the sixth census bucket of `object-view-unmirrored-keys-7779` empties into the protocol-retired ones, the `list-view` parity exemption leaves, and the live-e2e backend pin reads `18.0.0`.
