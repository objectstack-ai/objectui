---
'@object-ui/plugin-detail': patch
---

A record details section on a print page prints every field it declares, with no "Show N empty fields" button on paper (objectui#12717).

On screen, a section that has some empty fields hides them and offers a "Show N empty fields" toggle. That density rule is the renderer's own, not something the page declares, and on a page that declares `print` it put the toggle on paper while the empty fields stayed off it. On a print page the rule is now off: every declared field prints, an empty one as its placeholder dash, and there is no toggle. A section authored with `hideEmpty: true` whose fields are all empty still prints nothing, as it declares. Off a print page nothing changes.
