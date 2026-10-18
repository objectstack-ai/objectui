---
'@object-ui/app-shell': patch
---

Studio Interfaces: a leaf save that goes through now clears the red "Changes not saved" strip an earlier refused save showed (objectui#11950).

A dashboard, report or page leaf whose draft the server refused showed the refusal strip, and the strip stayed after the next edit was saved. It kept saying the draft was refused until the author left the leaf. Each leaf save now starts clear, as the Data and Automations pillars' saves do: the strip goes when the next save is sent, and a save that is refused again shows its own refusal. The notice for a dashboard widget held unsent until it is bound is separate, and a save does not clear it.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
