---
'@object-ui/plugin-kanban': patch
---

A kanban board now answers its `cardTitle` / `titleField` choice ONE way on every surface
(objectui#8308).

`ObjectKanban` resolved the same authoring choice — which record field titles a card, spelled
`cardTitle` with `titleField` as its legacy alias — in two places with two different operators:
`||` in the card list and `??` in the record-detail drawer's heading. Those differ on exactly
the falsy-but-present values, and on a string key that value is the empty string, so a board
authored `{ cardTitle: '', titleField: 'name' }` titled its CARDS from `name` while its DRAWER
heading fell through to the `Record #<id>` floor — one authored document, two answers.

The pair is now read once, through the exported `resolveKanbanTitleField`, and both sites call
it. `''` is UNSET on either key — `cardTitle` names a record field and `''` can name none, so
it falls through exactly as an absent key does and `cardTitle` wins when NON-EMPTY. That is the
precedence the registry already published in prose ("`cardTitle` wins when both are authored"),
extended to the one case that prose never covered; nothing in the tree had said what `''` meant
here, which is what let the two operators drift apart. A board that authors a non-empty
`cardTitle`, or only `titleField`, resolves exactly as before on both surfaces.
