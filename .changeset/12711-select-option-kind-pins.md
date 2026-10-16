---
---

No package released: test pins only, no behaviour change. `@objectstack/spec` 18 adds an optional `kind` (`'open' | 'won' | 'lost'`) to `SelectOptionSchema` (objectstack#23846). `@object-ui/types` derives the spec's keys by reference, so both select-option faces carry it with no source edit. The tier-1 convergence pins in `select-option-tier1-convergence-7014.test.ts` now state `kind` as a deliberate optional widening. They name it through a key read off the spec's own type, so they hold against the installed spec and objectstack `main`'s alike (objectui#12711).
