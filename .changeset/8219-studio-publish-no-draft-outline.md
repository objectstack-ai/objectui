---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio Publish button with nothing to publish is an outline button that says why

With no pending draft, the Studio header's Publish button was disabled but kept
the primary style, dimmed only by opacity, and the reason ("No drafts pending
publish") was in its tooltip alone. It now renders as an outline button, and
the same reason string shows as visible text beside it, linked as the button's
accessible description. With a pending draft it is the primary button, as
before. A read-only package also gets the outline style; its existing
Read-only badge already names that reason on the page.
