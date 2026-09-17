---
"@object-ui/cli": patch
---

Stop `objectui check` reporting five real page types as unknown.

`ui:page`, `ui:app`, `ui:utility`, `ui:home` and `ui:record` are registry keys the platform stores and the renderer paints, and `objectui check` called every document that spelled one of them an unknown schema type. The list the check judges against is generated from this repository's registration calls, and the generator could not see a `namespace` that arrives through a reference: the page kinds declare their options once and register from that object — one call passing it whole, four spreading it to vary a label — so there is no `namespace:` inside any of those call spans. The derivation read the bare half of each registration, produced no finding, and shipped a list short by exactly the namespaced half.

The derivation now follows an options object passed by identifier or by top-level spread, and a spread it cannot follow is reported instead of assumed namespace-free. A validator that refuses what the platform renders is the expensive direction — it teaches authors to stop reading the validator, which costs the opposite direction (a type the check blesses and the runtime rejects) its only reader.

The registration calls themselves are unchanged; so is every key that was already derived. Five keys are added to the generated list and none is removed or renamed.

⚠️ Read against a census, not a guess: every `ComponentRegistry.register` / `registerLazy` call in the tree was classified by how its options argument arrives, because "are these five all of them?" was explicitly unmeasured when this was filed. The five page kinds were the only registrations losing a namespace this way; the one other site reaching its options by reference registers a third-party plugin's own key and is already declared unresolvable-by-design. `deriveRegistryKeys`' `metaViaReference` counter re-derives that population on every run — the number is not written down anywhere, here included.
