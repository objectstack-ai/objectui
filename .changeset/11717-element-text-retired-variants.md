---
'@object-ui/components': minor
---

`element:text` drops the two pre-convergence `variant` spellings `heading` and `subheading`, which `@objectstack/spec` 17.7.0 retires (objectstack#21015, objectui#11717). The registry `inputs` enum is the contract's nine values again: `h1` to `h6`, `body`, `caption` and `overline`. The html tier therefore refuses `heading` / `subheading` with `invalid-enum`, as `objectui validate` and the spec do. A stored node that still carries one renders as `body`, the renderer's answer for any value outside the contract. Migration: `heading` -> `h2`, `subheading` -> `h3`. `os migrate meta --from 17` lists the edits.
