---
'@object-ui/app-shell': minor
'@object-ui/console': patch
---

Studio reaches the organization's own flows that belong to no package (objectui#11553).

A clone of a packaged flow is, by ADR-0126 §7.1, an ordinary org-owned flow, and the clone door stores it with no package on purpose. Studio was routed and listed per package, so the clone matched no route and no rail: the Studio home said "No writable packages yet", the read-only package's Automations rail listed only the packaged flows, and a deep link naming the clone opened another flow.

- **A package-less scope, `/studio/~org/automations`.** The same Studio design surface with no package under it. Its Automations rail lists every flow that belongs to no package (the unscoped flow list, narrowed by each item's owning-package field, plus package-less drafts), and opens each one editable. Edits save as drafts bound to no package; the header's count, the pending-changes sheet and Publish cover package-less flow drafts only, and Publish promotes each one by reference, since the package batch door cannot reach a draft bound to no package. The scope offers no other pillar, no "New" flow, no Create app and no package copilot. `~` is outside every package-id alphabet, so the segment can never name a package.
- **Reachable from Studio's home and from the package switcher**, whether or not a writable package exists.
- **A deep link names the flow it opens.** A `?surface=flow:` link naming a flow the rail does not hold no longer opens the rail's first flow in its place: from a package's pillar, a package-less flow is found and opened in the package-less scope; a flow found nowhere is reported on the canvas.
- A read-only package's flows stay read-only, as before.
- The console's `/studio` routes gain the scope's bare leg, `/studio/~org`, which lands on its one pillar.
