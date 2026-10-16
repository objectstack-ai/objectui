---
'@object-ui/plugin-grid': minor
---

The import wizard offers only the write modes its host says the target accepts (objectui#12697).

`ImportWizardProps` gains one optional prop, `writeModes`: the write modes the target's import door accepts, in the order the wizard offers them. Left out, the wizard offers all three (`insert`, `update`, `upsert`), as before.

- **The write-mode select lists only those modes.** The wizard starts in `insert` when it is offered, and otherwise in the first offered mode. Resetting the wizard or clearing a saved mapping returns to that same mode.
- **A saved mapping that writes in a mode the target does not accept cannot be picked.** The saved-mapping selector lists it disabled, with its write mode named after its label, for example "Roster update (Update existing (skip if no match))". The wizard never applies such a mapping and never swaps its mode for another one.
- **An empty `writeModes` throws** when the wizard renders. A host that offers no mode has made an error, so the wizard does not show an empty select.

Clause-②: yes. One optional prop, `writeModes`, is added to the exported `ImportWizardProps`. Nothing narrows: every existing prop, type and accepted value is unchanged, and a host that leaves the prop out sees the same three modes it saw before. No language-pack key is added. The disabled mapping reuses the existing write-mode labels.
