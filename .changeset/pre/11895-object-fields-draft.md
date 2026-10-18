---
'@object-ui/app-shell': patch
---

Studio's field pickers offer the fields of an object that is still an unpublished draft (objectui#11895).

Studio and the metadata-admin designers read an object's fields through one hook, and that hook asked for the published object only. For an object built in Studio and not yet published, that read answers "not found", so every picker on it offered no fields: the flow Start node's entry-condition builder listed only `previous`, and an author had to switch to Expression mode and type the condition by hand.

The hook now reads the draft-overlaid object (`?preview=draft`), the same read the object picker already makes for its list. A pending draft's fields are offered before the first publish; an object with a pending draft offers the draft's fields; an object with no draft reads as before, in the same single request. A name with neither a draft nor a published object still shows the not-found message. Only callers that may read drafts see them: the server answers anyone else the published object. The runtime view configuration panel passes its own field list and does not send this read.

No export, prop, type member or language-pack key changes.
