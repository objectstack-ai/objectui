---
'@object-ui/app-shell': patch
---

Studio's action editor writes a script body that names its language, so the first keystroke is no longer refused (objectui#11921).

- **Switching to "Run a script".** Choosing "What it does: Run a script" on an "Update fields" action now writes a body in Expression (L1), the language the Script language picker already shows. It used to write no body, and typing into the editor wrote a body with no language, which the spec refused until you picked a language by hand. The body is complete, and saves, as soon as you type its source.
- **Typing and changing the language.** Every body the editor writes keeps the language it names. Switching a Sandboxed JS (L2) body to Expression (L1) drops the L2-only grants and limits (`capabilities`, `timeoutMs`, `memoryMb`), which an expression body cannot carry.
- **Switching to "Update fields".** The action gets the empty field-value list a new action starts with, so it is saveable at once instead of refused for having nothing to write.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
