---
---

Internal tooling only, no package source changed.

`census:cross-file-line-citations` refused every run on `main` — `exit 1`,
`✗ 1 control(s) failed -- this run is NOT a reading` — because its controls were
addressed by FILE PAIR while `evaluateControls` folded every row matching that
pair into one answer. Two epitaphs in `packages/types/src/crud.ts` address
`packages/plugin-detail/src/index.tsx` with one number between them; the number
rotted, and one unrelated sentence took the whole census down with it.

A control now names ONE citation: the citing file, the file it cites, and a
SUBJECT phrase out of the citing prose — still by content, still never by a line
number of its own. Zero matches, or more than one, is a failure rather than
something to fold away. The non-firing control also now requires positive
evidence (`resolves`) instead of merely the absence of a false verdict, so a
verdict the census declined to reach can no longer pass it.

The rotted `crud.ts` address was NOT re-numbered and NOT repaired here:
objectui#8875 clause 4 reserves how an address is repaired, and it stays in the
population where this census reports it.
