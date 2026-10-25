---
"@object-ui/app-shell": patch
---

Clause-②: yes
Metadata-protocol: none

The metadata designer's translation preview draws the `positions` and `permissions` groups that `@objectstack/spec` now declares on a translation bundle, each with its own card, count and sample, and counts them in the coverage bar. Before, the preview did not type-check against that spec, and a bundle that translated only position or permission-set labels read as empty.
