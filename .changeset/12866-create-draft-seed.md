---
'@object-ui/app-shell': patch
---

Metadata designer create flows now show the spec create seed's structural defaults before the first save. A new dataset's Measures section reads 1 (the seed's `count` measure) as soon as the type registry answers, which is the measure the save already wrote. Only keys the draft does not yet hold are filled, so nothing the author set first is overwritten, and the seed's placeholder identity (its `label` and placeholder object binding) still never reaches the draft or the saved body.
