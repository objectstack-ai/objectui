---
---

Internal instrument only (objectui#9870): `scripts/changeset-polarity-census.mjs` and its
pin. No published package changes, no schema change, no runtime behaviour change.

**A TABLE OF SUPERSEDED READINGS.** A pending entry may carry a table whose first column is
a reading it is RETIRING and whose later columns say what falsified it and when. The census
read that first column as a present-tense claim about today's tree, with its own correction
one cell to the right and unread. Quotation position could not reach it, because the retired
reading is not quoted — it is tabulated. It was the last entry on the instrument's own limits
list still marked unrepaired as a false-positive SOURCE.

Measuring it first moved the repair. The limits entry said the cells of one ROW were joined
into one sentence and called that join deliberate; the code doing the joining carried the
opposite intent in its own comment and achieved neither. `. ` cuts a sentence only before a
character that is not lower-case, and a row's last cell got no terminator at all — so an
entire table, header and delimiter row included, collapsed into ONE sentence, and every key
in it was offered to every schema named anywhere in it. That is the cartesian window
objectui#9754 closed at the sentence level, rebuilt one level up.

A table is therefore read as structure rather than flattened into wrapped prose: a cell is
its own unit of text, the delimiter row is dropped as syntax, and the header row is kept —
it is what lets a column be read as a position. POSITION gains a third value, `superseded`:
a cell in a column the table's OWN HEADER retires (the column a later one declares it was
«falsified by») is counted, reported under its own name, and never flagged.

Of the three directions the card offered, this is the narrow one, and the other two were
refused for the same reason: excluding table rows from assertion position as a class, or
widening quotation to cover every tabulated reading, are both cheap against this corpus and
both buy a false negative in the shape this family has already paid for — a table that
ASSERTS is the ordinary case here, and a claim silently never judged is the failure that
does not ring.

READINGS, taken on `.changeset/` at the parent commit and again after, with the instrument's
controls passing on both runs:

- candidate contradictions: 40 before, 40 after — the SAME 40 rows. No row stops being
  flagged, so no row needs adjudicating as a dropped false positive or a lost true positive.
- sentences scanned 18412 → 19104, assertions 226 → 225, and a new bucket reporting 2
  readings in superseded position (both from the entry the card names).
- «a schema whose symbol resolves nowhere this run can reach»: 3 → 2. The dropped row is a
  retired reading whose own row records the card that retired that symbol — a candidate
  whose adjudication was already written beside it. Correctly dropped.
- the fixture corpus, where the shape and its three counter-shapes are pinned: 5 flags → 2.
  Four false positives dropped (two retired readings, two cross-ROW pairings) and one true
  positive FOUND — the falsifier column is a claim about today, and the collapse had
  swallowed it.

RESIDUE, named rather than discovered later: a `before | after` table retires its first
column by MEANING and not by a word in its header, and is not read here; the header match is
a word list with this file's usual cost; and a claim whose subject sits in one column and its
verb in another is now two sentences and pairs with nothing — it was reachable only through
the cross-row collapse that also paired it with every other row.
