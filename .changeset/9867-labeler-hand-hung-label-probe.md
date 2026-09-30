---
---

Workflow comment only, no package released: the header of `.github/workflows/labeler.yml` now
records a measured answer to objectui#9867 — whether a label hung by hand on a pull request, and
absent from `.github/labeler.yml`, outlives the `synchronize` run of `actions/labeler` with
`sync-labels: true`. The reading was taken on this change's own pull request by one real push.
