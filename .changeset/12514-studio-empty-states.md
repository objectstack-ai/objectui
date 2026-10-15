---
'@object-ui/app-shell': patch
---

Studio's empty surfaces now carry the action that fills them (objectui#12514).

**What changes for authors.** An object with no validation rule, hook or action, and a package with no automation or permission set, now shows one centered block in the content column: the tab's or pillar's icon, one sentence, and a primary button — New validation rule, New hook, New action, New automation or New permission set. The button opens exactly what the existing "New" or "+" opens: the same presets menu for rules and actions, the same new hook, and the same create dialog for automations and permission sets.

- **Nothing to select, nothing shown.** The empty right-hand editor card and the Automations configuration aside no longer fill the page with "Select…" sentences while there is nothing to select. Where items exist, the editor opens on one as before; the Hooks tab, which opens none until one is picked, still says so.
- **The rail says where its "+" is.** The Automations and Access rails' empty sentence now names the "+" above it, instead of pointing at a "New" that was not there (Automations) or at something "below" (Access).
- **Read-only packages.** The block shows its sentence without a button, and the rail no longer points at a "+" a read-only package does not have.
