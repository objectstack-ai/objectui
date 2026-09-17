---
---

Release-note and test-comment repair only; nothing published moves.

Three sentences that had gone false are repaired in place: two in pending
changesets that publish verbatim into this same release
(`7129-retire-detailviewsection-hideempty.md`,
`7064-empty-section-default.md`), and one in
`recordDetailsInputs.spec-parity.test.ts`'s own header. Both changeset
frontmatters are byte-identical to their state at the merge-base, so no
package's declaration or bump level moves; the touched test file is a test and
publishes nothing. objectui#9637.
