---
---

Retire the "not registered in the port pin" rationale for
`scripts/check-bash32-floor.mjs`, in both of the places it was written
(objectui#9206). Prose in a repo-internal gate and in its workflow wiring
comment, plus the two matching divergence pairs in
`scripts/upstream-port-pin.json`; no package source, no published contract and
no gate behaviour is touched, so nothing is released by this change.

Both copies argued that the file was deliberately unregistered because the
ledger carried ONE repository-wide `upstream.ref` that `--resync` rewrote for
every entry. Neither half is true any more. objectui#8288 retired that field —
`check-upstream-port-parity` now REFUSES a pin that still carries it, and a
re-sync writes only the re-synced entry's own ref and digest — and
objectui#8694 then registered this file at its own ref, with its divergences
declared. So the workflow step a reader consults first, and the port's own
docblock, both explained a decision by naming a mechanism that no longer
exists.

The workflow comment now states that the file IS registered and where its ref
lives; the docblock's "Why this port is not YET pinned" section is replaced by
a short pointer at the ledger entry, which also records that editing this prose
edits PINNED bytes and must move the matching `ported` side in the same change.

⛔ No revision is named in either piece of prose, and the previous comment's
revision was dropped rather than refreshed. That is the whole lesson the
section carries: it had already gone stale twice by naming one, and a third
time by arguing from a registration state that had changed underneath it. The
ref lives on the entry in `scripts/upstream-port-pin.json`, beside the digest
it was taken with, where `--resync` keeps it correct.
