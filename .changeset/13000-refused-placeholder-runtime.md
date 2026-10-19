---
'@object-ui/plugin-detail': patch
---

`record:quick_actions`: a refused declared action array (a mixed id/object array) no longer draws its "refused at index N (see console)" box in a runtime view. That box is developer copy, so it is drawn on a design / preview surface only, the same rule the block's "no actions configured" placeholder follows. The console error naming the offending index still fires in every view (objectui#13000).
