---
'@object-ui/app-shell': patch
'@object-ui/fields': patch
---

fix: the package sheet and the record create form no longer log React warnings (objectui#11804)

The package sheet's "Pending changes" header was a paragraph holding the draft-count badge, and the badge renders a block element. A block inside a paragraph is invalid HTML, so every time a package with pending drafts opened the sheet, from the console's metadata admin or from Studio's *Package info & settings*, React logged a DOM-nesting error. The header is now a block container with the same classes, and it looks the same.

A select field the create form did not seed opened as an uncontrolled dropdown, and the user's first pick switched it to controlled, so React logged "Select is changing from uncontrolled to controlled". The select widget now renders a controlled dropdown from its first render for every host that hands it an `onChange`: an unset value shows the placeholder exactly as before. What a form saves is unchanged. A picked value is saved as before, and an untouched select still sends no value. A select node rendered with no `onChange` stays uncontrolled, so it still shows the user's pick.
