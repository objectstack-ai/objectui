---
'@object-ui/plugin-tree': patch
---

Import `ObjectTreeSchema` instead of re-deriving it (objectui#9550)

`ObjectTree` typed its node by narrowing the published union on the `object-tree`
tag and binding that to a module-local alias. That spelling was correct and it was
forced: the name it wanted was declared in `@object-ui/types` and re-exported by
the `./zod` barrel, but the root barrel did not carry it, so there was nothing to
import. objectui#9550 put the name on that barrel, and this package now imports it.

Nothing about the type changes — the imported name and the narrowing resolve to the
same declaration, which `ObjectTree.schemaTyped-8655.test.ts` asserts invariantly and
independently through `ObjectTreeProps['schema']`. What changes is that the renderer
no longer carries a derived restatement of a published type. A type nobody can import
mints one of those per consumer, and each one is correct on the day it is written —
that is the second-authority shape objectui#6349 is burning down, and this was one of
its instances rather than a tidy-up.

The docblock's justification paragraph went with it: it stated, as its measured reason
for choosing the narrowing, that the barrel omits the name so it "cannot be imported
today". That sentence is false as of objectui#9550 and nothing re-derived it. The
objectui#8651 warning beside it is KEPT and re-pointed at the import: a module-local
type wearing a published type's name is the two-layers-one-word trap, and it is more
load-bearing now that the published name is importable, not less.
