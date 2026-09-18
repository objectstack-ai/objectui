---
'@object-ui/plugin-form': patch
---

`object-form`: a section that declares `collapsed: true` is now collapsible — the
disclosure control is installed whether or not `collapsible` is also written
(objectui#9780, maintainer ruling 2026-09-18, letter A).

The grouped layout read `collapsed` for the section's initial state
unconditionally, but installed the toggle only for a section that also declared
`collapsible`. The two are independent members and every declaration face accepts
either alone, so `collapsed: true` written by itself — the most natural spelling of
"collapsed by default" — rendered a permanently closed section: its fields were out
of the DOM and nothing on the page could bring them back, with no error, warning or
degradation.

`collapsible: true` on its own is unchanged (open, toggle present), and
`collapsible: false` together with `collapsed: true` resolves the same way the
ruling states: collapsed wins and the toggle is present. A section declaring
neither member is untouched. Nothing is refused that was accepted before — the
accept set is unchanged and only behaviour widens, so no author can lose anything
they could previously depend on.
