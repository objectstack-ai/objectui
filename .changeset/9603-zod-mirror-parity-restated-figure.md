---
---

Test-only (objectui#9603). `zod-mirror-parity.test.ts` had a docblock clause restating a
live figure — the `Tests N passed (N)` line vitest prints for this file — and it had
rotted. AGENTS.md #9 forbids exactly that: name the instrument that re-derives a claim,
never write down its answer. The irony was the card's point, and is why this is graded a
contract violation rather than a typo: this is the file whose whole job is to stop a
hand-written restatement drifting away from what it restates.

**The figure was REMOVED, not refreshed, and the measurement is what decided that.** Three
readings of the same sentence: it said 12, true when objectui#6705 wrote it; the filing seat
measured 32 on `origin/main`; `vitest run` printed `37 passed (37)` at `4b577229` two days
later when the card was worked. A replacement number would have been false again within
about one merge. ⭐ And the reason generalises past this one clause: this suite grows
whenever a pin is added, which is this file WORKING — so a restated case count rots ON GOOD
NEWS, and no amount of diligence makes it durable. Only deleting it does. The figure-free
spelling was not invented here either; the sibling `WiderLedgerMismatch` clause thirty lines
below already said "their passing test counts do not move when this reddens" and has never
rotted, which is AGENTS.md #9 already applied once inside this same file.

**What was NOT touched.** The file's header splits a docblock by CLAUSE: a clause that
RECORDS a measurement is historical and ⛔ may never be rewritten by a later card, while a
clause that GIVES GUIDANCE must be true now and must be amended, citing the card that moved
it. The restated figure sat in the guidance half, so amending it is obligatory rather than
merely permitted; the two record clauses beside it — "it did not move under the ablation
either" and "(It read `5 passed (5)` until objectui#6705 …)" — are left byte-identical. The
card had read the whole sentence as one RECORD clause, which is why it was filed rather than
repaired in place; that reading is corrected here, and the outcome is unchanged because the
choice between deleting and pinning was still a judgement.

No runtime behaviour, no assertion and no ledger entry changed — ⛔ deliberately: what a test
asserts is not to be touched while editing its prose.
