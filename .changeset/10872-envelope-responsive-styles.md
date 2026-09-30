---
'@object-ui/types': minor
---

Every ADR-0080 public-block arm accepts the node-level `responsiveStyles` that `@objectstack/spec`'s `PageComponentSchema` declares, and judges it as the spec does (objectui#10872, batch 8).

**Clause-②: yes (widening)** — the strict authoring face (`StrictAnyComponentSchema`) now accepts a node-level `responsiveStyles` on the 30 public-block arms (`PublicBlockComponentSchema` and `ObjectQLPublicBlockComponentSchema`), where it refused the key by name. On the tolerant face (`safeValidateSchema`) the key was already accepted, unjudged; it is now judged, so a value the spec refuses is refused there too.

**What it was.** `responsiveStyles` is the ADR-0065 per-breakpoint style map that `SchemaRenderer` compiles to CSS scoped to the node. The spec declares it on every page component, the objectstack showcase writes it on public-block nodes (`element:text`, `element:button`, `object-metric`, `page:card`) and objectstack's UI skill teaches it. No arm here declared it, so a spec-valid node failed the strict face with `unrecognized_keys`, and the tolerant face kept any value it was given: `responsiveStyles: 7`, or a breakpoint the spec does not have (`md`), parsed clean and styled nothing.

**What changed, in observable terms.**

- Each public-block arm declares `responsiveStyles` as the spec's `ResponsiveStylesSchema`, by reference, so its breakpoints (`large`, `medium`, `small`, `xsmall`), its strictness and its own unknown-breakpoint message come from the spec. All 30 arms share one declaration.
- A node such as `{ "type": "page:section", "responsiveStyles": { "large": { "padding": "var(--space-6)" }, "small": { "padding": "var(--space-4)" } } }` parses on both faces, and the map comes back unchanged.
- A value the spec refuses (a `md` breakpoint, a number instead of a map, a style value that is neither a string nor a number) is refused on both faces at `responsiveStyles`, with the same issue the spec reports. On the tolerant face this is a narrowing: such a value used to pass unjudged, and `SchemaRenderer` would not have applied it.
- Nothing else widens. `BaseSchema` does not declare `responsiveStyles`, so the strict face still refuses it on the other arms. The other node-level keys the spec declares (`events`, `aria`, `visibility`, `responsive`, and `dataSource` outside the arms that already read it) stay undeclared and are still refused by name on the strict face.
