---
'@object-ui/components': patch
---

A collapsible form section header can be opened from the keyboard (objectui#13220).

In a sectioned form, such as the record Create/Edit dialog or the drawer form, a collapsible field group's header was announced as a button with an expanded or collapsed state, but it was not a tab stop and no key toggled it: Tab stepped over it, and a group that starts collapsed could only be opened with a mouse. The header is now in the Tab order, Enter and Space open and close the group, and it shows a focus ring when focused from the keyboard. Neither key submits the form, Space does not scroll the dialog, and holding a key down does not toggle the group again. A section header that is not collapsible is unchanged and is not a tab stop.

No export, prop or schema key is added.
