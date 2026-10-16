---
'@object-ui/app-shell': patch
---

Studio at a narrow width keeps the words that matter readable (objectui#12611).

- **The package chip.** On a narrow header the chip no longer cuts the package name to three letters to make room for "Read-only": the word gives way first, the lock stays, and the name truncates only after that. The chip's room is the header column's, not a fixed cap tied to the window width. Its tooltip now holds the whole name, the read-only reason and "Switch / create package".
- **The item header.** When the content column is narrow (an aside open at 1024 px), the muted meta line (a flow's trigger and status, a field count) goes first, then the draft chip's text — its pencil stays and its text is in its tooltip — and the title truncates last, so "Enroll Members in Campaign" stays whole.
- **The tab row.** Tab labels never wrap to two lines. When the tabs are wider than the row, it scrolls sideways, fades the edge that has more tabs past it, and keeps the open tab in view.
- **Interfaces, folded.** When the properties aside folds into the "Canvas / Properties" toggle, the Properties segment shows a dot while it holds an editor, and the canvas keeps a 16 px gutter instead of 24.
