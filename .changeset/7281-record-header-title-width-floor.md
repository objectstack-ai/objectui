---
'@object-ui/plugin-detail': patch
'@object-ui/layout': patch
---

Record headers: give the title column a width floor so a wide action tail can no
longer starve it.

Two headers repeated the title/action width arbitration objectui#7244 fixed on
`page:header`. Both were measured in Chromium at a 799px viewport with three
labelled `record_header` actions, before and after:

| header | before | after |
| --- | --- | --- |
| `DetailView` (`type: 'detail'`, the header that renders when the host supplies no `page:header`) | h1 6.17px of a 218px title | 218.39px, tail wrapped to its own line |
| `PageHeader` (`@object-ui/layout`) | h1 170.59px of a 265px title | 751.00px, tail wrapped to its own line |

`DetailView` gets the precedent's two utilities, both `sm:`-scoped so the
sub-640px column layout is untouched: `sm:flex-wrap` on the row and
`sm:min-w-64` on the title column. The floor is one step above the precedent's
`sm:min-w-48` because this title column carries the 40px back button and a 12px
gap inside it, so 256px is what leaves the h1 the same ~192px readable floor.

`PageHeader`'s row already wrapped, so it needed only the floor — and that floor
is unconditional rather than `sm:`-scoped, because this row has no
breakpoint-scoped direction change and the squeeze measures worse just below
`sm` (639px: h1 10.59px of a 212px title). `min-w-48` replaces `min-w-0` rather
than joining it: an explicit min-width overrides a flex item's automatic
min-content minimum exactly as `min-w-0` did, so long titles still ellipsise
(measured at 799px: 751px rendered of a 1682px title, no horizontal overflow).

Wide viewports are unchanged: at 1440px both headers keep the tail on the
title's line with the title unclipped, before and after alike.
