---
---

No package released: CI configuration, one docs page and tests. `turbo.json` gives the root `//#lint:root` task the inputs it lints, so every package's `lint` hash stops moving on unrelated files and the `Lint` job's restored cache can replay it. The four turbo caches that restored a bare `turbo-<os>-` key (`Lint`, `Build Docs`, `Changeset Release`, `Bundle Analysis`) each get their own key prefix, are written only by runs on `main`, are pruned to what the run used, and report what they replayed (objectui#12276). No published package's files change.
