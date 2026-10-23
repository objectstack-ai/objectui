---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Setup › Packaged automation: the Clone dialog now opens with a name and label filled in (objectui#13344).

It used to open with both fields empty. It now proposes `<source>_copy` as the machine name and "<source label> (copy)" as the label, using the flow's machine name when it has no label. Both fields stay editable, and the dialog can be submitted as it opens: the proposed name keeps the lowercase snake_case shape a flow name must have, and it is the same name the server suggests when a name is taken. A name that is already taken is still refused by the server with its 409 message, shown as sent.

One new language-pack key, `packagedAutomation.cloneCopyLabel`, in all ten packs.
