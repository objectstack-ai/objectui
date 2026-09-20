---
---

Internal instrument only (objectui#9754 slice 2): `scripts/changeset-polarity-census.mjs`
and its pin. No published package changes, no schema change, no runtime behaviour change.

**WINDOW PAIRING.** The census reads a pending entry for present-tense claims about what a
face declares, and it used to pair every schema symbol a SENTENCE names with every key that
sentence names — a cartesian product over a window nothing chose. The instrument named the
cost on itself, under the heading that lists what produces its false positives: a sentence
may name a symbol and a key and predicate that key of something else entirely.

The window is now the clause whose verb governs the key, and the pairing is made once per
OCCURRENCE rather than once per key. In one line: I stopped pairing a key with a symbol the
sentence names when the key is predicated of something else — of a registry-local type, of
another node, of a zod method, of a CLI subcommand. The four cases of the rule, plus the
fifth for a relative clause (which has no subject of its own and takes its antecedent's),
are on `readWindow`, and `scripts/__tests__/changeset-polarity-census.test.ts` pin 12 pins
the substance rather than the existence of a reader: the key that moved is the one the
clause does NOT predicate of the named symbol, while the key it DOES predicate is still
flagged.

⛔ No count is written here, on either side of the change. The reading is whatever
`pnpm census:changeset-polarity` prints on the tree you run it against, and the before/after
flag set — key by key, each dropped row adjudicated as a false positive or a lost true
positive — is on this slice's pull request, taken fresh at its own merge base.

⚠️ This narrowing has the mirror risk of the usual one: precision bought with blindness.
Three legs refuse that purchase and all three are pinned — the key a clause really does
predicate is still flagged; a coordinated object list past the cut is still reached; and the
blind spot this whole instrument exists to close still reads. The residues the narrowing
leaves, including a false negative it introduces, are written into the instrument's own
limits list rather than left to be found later.

Two further sources are recorded in that list and ⛔ not repaired here: the population
predicate still reads a declaration verb written inside a backticked span, and an entry
carrying a table of superseded readings has its retired rows read as live assertions.
