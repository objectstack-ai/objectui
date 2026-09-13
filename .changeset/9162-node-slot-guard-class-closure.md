---
'@object-ui/components': minor
'@object-ui/plugin-detail': minor
'@object-ui/plugin-report': minor
'@object-ui/plugin-timeline': minor
---

Close the numeric-falsy `SchemaNode` slot class: a slot may no longer guard itself
(objectui#9162, triage ruling 2026-09-12).

**What leaked.** `{schema.footer && <CardFooter>…</CardFooter>}` does not evaluate to
`false` when the slot is falsy — it evaluates to the **slot**, and React renders
numbers. A node slot's published zod face carries a `z.number()` arm
(`nodeUnionOptions`, `packages/types/src/zod/base.zod.ts`), so `footer: 0` is **legal
authored input**, and it painted a stray `0` into the DOM. `NaN` painted three
characters. The `&&` also short-circuits, so `renderChildren`'s own
`if (!children) return null` first leg was never reached — which is why the
objectui#8908 bridge repair could not cover any of these sites.

**Why a class fix and not N instance fixes.** This class was patched one instance at a
time three times — objectui#8331 (`DataTableSchema.emptyAction`), objectui#9033
(`header-bar`'s `rightContent`), and then objectui#9162's census found eleven more,
because objectui#9033's grep was keyed on the spelling of the **right** operand while
the trap depends only on the **left** one. Nineteen guards across eight files are
repaired here, and the construct that permits them is now refused mechanically.

**The one spelling, and the gate.** `renderChildren(slot)` is the guard for a bare
slot; the new `renderNodeSlot(slot, render)` is the guard for a slot wrapped in chrome
that must disappear with it. Both route through one exported predicate,
`isEmptyNodeSlot`. The new lint rule `object-ui/no-bare-node-slot-guard` refuses the
`&&` spelling, deriving its slot set per file from the file's own text — an expression
is a node slot there if that file hands it to `renderChildren`, `renderNodeSlot`,
`toRenderableSchema` or `<SchemaRenderer schema={…}>`. A twelfth slot is rendered
through one of those, so it is covered the moment it is written, with no list to keep
up to date.

**Why `minor`.** Two reasons, and neither is a contract break.

1. `@object-ui/components` gains public API: `renderNodeSlot` and `isEmptyNodeSlot` are
   new exports. A new export is a `minor` on its own.
2. Published renderers change what they emit for two authored inputs. A node slot
   authored `0` / `-0` / `NaN` stops painting that character — that is the defect, and
   no author asked for it. A node slot authored `[]` no longer renders its empty chrome
   (an empty `CardHeader` / `CardContent` / `CardFooter` / `DialogFooter` /
   `SheetFooter` / `DrawerFooter` / `TableFooter`, or `plugin-detail`'s wrapping
   `div`); the chrome now appears and disappears with its content. Measured across
   `examples/`, `content/` and `apps/`: **zero** authored node slots carry a numeric
   value, and the single authored `"children": []` is on `div`, which never had the
   `&&` guard and is unaffected.

⛔ Deliberately **not** marked `**BREAKING**`: no authored input stops being accepted,
no export is removed, no key stops being read, and objectui#7105 is respected — the
declarations are untouched and node slots still relax the renderer. An author who
genuinely wants the character `0` writes `"0"` or a `text` node, both unchanged.
