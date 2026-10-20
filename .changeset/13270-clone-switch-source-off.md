---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Setup › Packaged automation: the clone result now offers the next steps (objectui#13270).

A clone of a packaged flow is created `draft`, which does not switch it off, so a cloned record-change or schedule flow runs beside the flow it was copied from. The result used to show the server's notice and nothing to click. It now keeps that notice and adds:

- **Switch "SOURCE" off** — calls the same packaged-flow toggle as the row's own switch, for the flow that was cloned. On success the row reads off and the result says the source is switched off. A refusal shows the server's message beside the button, and the button stays. When the source is already off, no switch-off is offered.
- **Open the clone in Studio** — links the package-less Studio scope (`/studio/~org/automations`) opened on the clone.

The clone itself is unchanged. Three new language-pack keys, `packagedAutomation.cloneSwitchSourceOff`, `.cloneSourceOff` and `.cloneOpen`, in all ten packs.
