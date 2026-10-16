---
"@object-ui/app-shell": patch
---

Flow designer: the analysis passes stop modelling the retired single-brace dialect (objectui#12390). A node rename now rewrites only CEL and `{{ }}` holes, so a literal `{x.y}` in a config string no slot reads stays as written. The Problems panel judges a body-less loop's `collection` as the bare variable name its executor reads, and leaves a value-slot collection to the value-slot checks. The internal `refMode: 'template'` descriptor mark is gone; the loop and map `collection` fields are plain expression fields.
