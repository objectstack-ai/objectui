---
'@object-ui/plugin-detail': patch
---

`DetailView`'s record header no longer sizes its title column to the record
name below the `sm` breakpoint (objectui#9119).

Below `sm` that header row is a **column** flex container, so the title
column's width is its **cross** size — and `items-start` sizes a cross axis to
fit-content. The column therefore took the h1's max-content width whatever the
viewport was, the h1's `truncate` never fired because its containing block had
been sized to the text, and the record page overflowed by the difference. The
threshold was low: roughly 12.5px per character, so on a 375px phone any record
name past about thirty characters was enough.

None of the three utilities already on that element could have stopped it, which
is why it survived two neighbouring fixes: `min-w-0` is a **floor, not a
ceiling**; `flex-1` acts on the **main** axis, which in a column container is
**height**; and `truncate` cannot fire inside a containing block that was sized
to its own text. The repair is a definite cross size — `w-full sm:w-auto`, the
same pair the action tail one level down already carries for the same reason.

Measured in Chromium with a 98-character record title, before and after:

| viewport | title column | h1 rect | ellipsis? | document overflow X |
| --- | --- | --- | --- | --- |
| 320px | 1045.59px -> **320px** | 997.59px -> **272px** | no -> **yes** | 726px -> **0px** |
| 375px | 1045.59px -> **375px** | 997.59px -> **327px** | no -> **yes** | 671px -> **0px** |
| 639px | 1045.59px -> **639px** | 997.59px -> **591px** | no -> **yes** | 407px -> **0px** |
| 799px | 799px -> 799px | 747px -> 747px | yes -> yes | 0px -> 0px |

`sm:w-auto` is what keeps that fourth row identical: at and above `sm` the row
is a row again and the title/action arbitration objectui#7281 fixed is reached
unchanged. It is the lit control for this change, and it did not move.

What a user actually saw is a **clip, not a page scroll** — the half
objectui#9119 filed as unmeasured. In the console the header renders inside
`AppShell`'s content `main`, which `ConsoleLayout` styles `overflow-x-hidden`
(computed: `overflow-x: hidden`, `overflow-y: auto`); at 375px that pane held
1046px of header in 375px of width, so 671px of the title was clipped away with
no scrollbar — and, because the h1's own `truncate` never fired, with no
ellipsis either. The document itself never scrolled.
