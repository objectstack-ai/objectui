---
---

Rebuild the changeset polarity instrument as `pnpm census:changeset-polarity`
(objectui#9727), with its pins in `scripts/__tests__/changeset-polarity-census.test.ts`.

**Empty frontmatter is a MEASURED declaration, not a default.** This change adds
two files under `scripts/` plus fixtures, and one `scripts` entry to the root
manifest. `node scripts/check-changeset-presence.mjs` reads the diff as 0 files
of published source and 0 manifests whose published contract moved, against a lit
control on the same tree: appending one comment line to a file under
`packages/types/src` flips that same gate to exit 1 and demands an entry. So the
claim here is that nothing published moved, and it is the gate's reading rather
than an assumption.

**Why an instrument and not a sweep.** objectui#9727 carries a derived candidate
set over pending changeset prose, and both of its tables are TRANSCRIBED — the
producing script was cleaned up with its author's worktree, so no number on that
card is re-derivable. Acting on a candidate table nobody has run is how a second
generation of false records gets made, which is the defect the whole family of
cards is about. This change repairs no changeset body.

**The blindness that came with the transcribed numbers, closed.** That instrument
missed the site that motivated the card: a claim whose object is the pronoun
"them", resolved across a sentence boundary. An instrument blind to the shape
that produced it reports a floor, not a census. The rebuild resolves that shape
and the pin carries the pre-repair text of the site itself, so the pin goes red
if the blindness returns.

Four properties the rebuild has that the transcribed one did not: a whole-file
whitespace-tolerant read (this corpus wraps near eighty columns, and a
line-anchored probe is structurally blind to any claim that wraps); assertion
position distinguished from quoted position (a repaired sentence quoted inside
its own retirement note must never be re-flagged); membership resolved as
(interface, name) through the TypeScript parser over both published faces, with
an inherited index signature deliberately NOT counted as membership; and the
cross-sentence pronoun.

The count, the controls and its three measured false-positive sources are what
the script prints — read them from a run rather than from prose, per commandment
\#9. It is wired into no workflow: `census:*` is this tree's spelling for
runnable, reported, not blocking.
