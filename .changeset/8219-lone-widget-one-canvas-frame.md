---
'@object-ui/app-shell': patch
---

fix(app-shell): a dashboard's lone widget fills the designer preview, and the Studio canvas draws one frame

In the dashboard designer preview, a dashboard with a single widget showed it
at its authored span (a half-width chart used half the grid), inside a grid
pinned to a 768px minimum that was wider than the Studio canvas. A lone widget
now spans the whole grid, and the 768px minimum applies only when there are
several widgets. Multi-widget dashboards lay out exactly as before, and the
widget keeps its authored row count. The preview never writes this layout back
to the draft.

The Studio Interfaces canvas no longer wraps a registered preview in a second
bordered, padded card: the preview's own frame is the only one. Canvas states
without a preview frame (empty, loading, no designer, the records grid) keep
the card.
