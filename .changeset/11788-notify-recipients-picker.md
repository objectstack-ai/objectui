---
'@object-ui/app-shell': patch
---

Studio builds a "notify the owner when the ticket is done" flow without JSON (objectui#11788).

- **Notify recipients render online.** With a backend, the notify node's form had no Recipients field, and its recipients sat in Advanced (JSON). The node descriptor publishes `recipients` with no `type`, because the contract takes a string or a list of strings, so the descriptor-driven form left the key out. A key the descriptor declares but the form cannot type now keeps Studio's own editor for it, in its declared place and with the descriptor's description. The same fix brings back the http node's Headers and Body editors.
- **Recipients are picked.** Each recipient row is a field of the trigger record (`{record.FIELD}`), a user (the user id), a team (`team:ID`) or an email address. These are the values the messaging service already resolves. Any other stored value, such as a flow variable or a `role:` selector, shows under "Other" and is saved unchanged. A recipient stored as a single string now shows as a row and stays a string.
- **Record field values pick their field.** On a create or update record node, the key of each field value lists the fields of the node's object. The value input is unchanged.
- **New automation asks for the trigger.** The dialog offers the Start node's own triggers, asks for the object when the trigger watches one, and writes the choice to the Start node. Left unset, the flow is created as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new strings are in the metadata-admin designer's own string tables (en and zh).
