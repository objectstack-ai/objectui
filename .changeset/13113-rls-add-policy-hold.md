---
'@object-ui/app-shell': patch
---

Studio's row-level security editor holds a policy until it has a name (objectui#13113).

"Add policy" inserts a blank row, and the package door's autosave used to send it at once: the server refused the nameless row with a 422, and the editor printed the refusal as schema paths and zod codes (`rowLevelSecurity.0.name [invalid_format]`) before the author had typed anything.

- **An unnamed policy is held, not sent.** While any policy has no name, the autosave holds, the same way a CEL syntax error holds it, and the row says beside itself "Give the policy a name to save it." The status line says the same, in a neutral tone. On the environment door the Save button is disabled for the same reason. The row stays in the draft while it is held. The test is emptiness only: the protocol's name format is not restated in the editor.
- **A refused policy name reads in the author's words.** When the server refuses a save and its issues name `rowLevelSecurity.N.name`, the strip reads "Not saved. Policy name, on row N: ..." with the server's own message for what is wrong. A refusal naming anything else keeps the text it showed before, and follows the mapped lines when both come together.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
