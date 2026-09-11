---
---

Give objectui#8920's case-P pin a wait of its own before it reads the hinted
column's `tel:` anchor (objectui#9035). The two assertions preceding it settle on
the inline rows; the anchor needs the `format` hint that only arrives with the
async object-schema fetch, so reading it bare sampled an unsettled render and
intermittently reddened PRs that cannot reach the code under test. Test only; no
package is released by this change.
