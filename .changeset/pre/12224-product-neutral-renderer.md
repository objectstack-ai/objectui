---
---

No package released: governance, a test and its data, no behaviour change. objectui is now a product-neutral renderer (ADR-0060, and a "Product-neutral renderer" section in `AGENTS.md`). `@object-ui/app-shell` gains a ratchet test under `src/__tests__/` that fails on a new product-named registry key, a new file in the frozen `environment/` and `console/organizations/` directories or named for a product, and a new key under a frozen locale namespace. Beside it sits the live list of today's product-specific surfaces, which only shrinks. The package tsconfig excludes `__tests__` from the build, so nothing under it reaches `dist`. The repository also gains a pull-request template with one checkbox.
