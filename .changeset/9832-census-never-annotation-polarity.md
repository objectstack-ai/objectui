---
---

**Internal tooling only, nothing published moves.** `scripts/changeset-polarity-census.mjs`
reads a clause's polarity over the clause's PROSE -- the text with its backticked
spans still masked -- instead of over the clause as written (objectui#9832).

The polarity criterion is a regex that runs on prose and it accepts `never`. But
a DECLARING clause can carry a type annotation that is also `never`, which is the
ADR-0049 by-name refusal tombstone spelling this lane settled on objectui#9764.
A sentence asserting that a face DECLARES such a key therefore read as a NEGATIVE
claim, and the verdict inverted with it: under the negative reading the entry "in
contradiction" is the one that HAS the member, exactly backwards. The word is
indistinguishable from the English adverb to a prose regex, so the repair is
positional rather than lexical.

⛔ `never` was deliberately NOT removed from the negator list. It is a real
English negator and a changeset sentence reading "the renderer never reads it"
has to keep reading as a negation; a pin asserts both legs, and asserts that the
same word in both positions in one sentence reads both ways. The repair also
covers a call expression such as a zod twin's, which an annotation-position rule
would not reach.

⛔ No changeset body was repaired. The two entries this card was filed from carry
CORRECT prose; the instrument was what was wrong, and rewriting them to dodge a
regex would have hidden the defect and corrupted two landed records.

**The bounded transition this change made**, stated as a finished fact about the
corpus as it stood when it was measured and NOT as a live claim: three rows moved
from a negative reading to a positive one and stopped being contradictions, three
rows inherited the corrected polarity and became candidates that the inverted
reading had been silencing, and the pinned objectui#9727 blind-spot fixture's
verdicts did not change at all. Run `pnpm census:changeset-polarity` for the
reading on whatever tree you are on; the census is report-only and a flag is a
candidate, never a defect.
