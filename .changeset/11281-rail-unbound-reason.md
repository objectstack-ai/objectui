---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's Automations rail stops telling a flow with a declared trigger that it has "no trigger"

The rail's status dot titled every enabled flow with `bound: false` "Enabled · no
trigger (run manually)". The `@objectstack/spec` contract says `bound` is false both
for a flow that declares no trigger and for one whose declared trigger the engine
has not armed, and that `triggerType` tells the two apart. The rail kept only
`enabled` and `bound` from the engine's runtime rows, so a package-authored schedule
flow held unarmed by deployment policy was told to its author as having no trigger
at all.

The rail now keeps `triggerType` and `reason` from the same `GET
/api/v1/automation/_status` rows, each only as a non-empty string. For an enabled,
unbound flow the dot's title is:

- the platform's `reason`, verbatim, when the row carries one. It is never parsed,
  compared or restyled, the way Setup › Packaged automation shows it (objectui#9217);
- "no trigger (run manually)" only when the row has no `triggerType`, which is the
  one case the contract lets `bound: false` mean that. Every older backend gets this
  title, as before;
- "Enabled", through the existing key, for a declared trigger with no `reason` (a
  backend that predates the field). It says nothing about the binding.

The visible "On" text and the dot's colour are unchanged, and nothing is styled as an
error. No locale key and no platform sentence is added.
