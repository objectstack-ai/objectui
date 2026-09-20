---
'@object-ui/types': minor
---

Declare the 13 renderer-read keys that no shipped type declared (objectui#6150)

**This is a published-surface change on `@object-ui/types` and its `zod` mirrors,
and it moves the accept set in TWO directions.** Read the next two paragraphs
before reading the list — they are what the change actually is.

**Key membership is NOT widened — it was never narrow.** All eight touched mirrors
extend `BaseSchema`, which is `.passthrough()`, and `.extend()` carries that policy
through (measured on the built mirrors: `catchall` is `z.unknown()` on all eight).
So before this change every one of the 13 keys already parsed green and already
SURVIVED the parse — admitted unexamined, neither refused nor stripped. Nothing
that parsed before stops parsing because a key became known.

**Value enforcement IS widened, which in the value dimension is a NARROWING.** For
the 12 keys that gained a zod mirror entry, the value is now validated against the
declared type: `{ type: 'text', content: 42 }` parsed green before and is refused
now, at `content`. That is the point of declaring them — `declared === enforced` —
but it is a behaviour change for documents that carried a wrong-typed value under
one of these 13 names. Keys OUTSIDE the 13 are untouched: an undeclared key of any
type is still admitted unexamined on all eight mirrors, pinned per mirror.

The 13, each with the renderer read site the declaration records:

| type | key | declared as | read at |
|---|---|---|---|
| `TextSchema` | `content` | `string` | `renderers/basic/text.tsx` — `{schema.content \|\| schema.value}` |
| `CarouselSchema` | `opts` | `Record<string, unknown>` | `complex/carousel.tsx` — `opts={schema.opts}` |
| `CarouselSchema` | `orientation` | `'horizontal' \| 'vertical'` | `complex/carousel.tsx` |
| `CarouselSchema` | `itemClassName` | `string` | `complex/carousel.tsx` — per-slide class |
| `FilterBuilderSchema` | `wrapperClass` | `string` | `complex/filter-builder.tsx` |
| `TreeViewSchema` | `nodes` | `TreeNode[]` | `data-display/tree-view.tsx` |
| `TreeViewSchema` | `title` | `string` | `data-display/tree-view.tsx` |
| `TreeViewSchema` | `onNodeClick` | `(node: TreeNode) => void` | `data-display/tree-view.tsx` — INVOKED |
| `CheckboxSchema` | `required` | `boolean` | `form/checkbox.tsx` — drives the `*` marker |
| `FileUploadSchema` | `buttonText` | `string` | `form/file-upload.tsx` |
| `FileUploadSchema` | `wrapperClass` | `string` | `form/file-upload.tsx` |
| `HoverCardSchema` | `align` | `OverlayAlignment` | `overlay/hover-card.tsx` |
| `ContextMenuSchema` | `trigger` | `SchemaNode \| SchemaNode[]` | `overlay/context-menu.tsx` |

These compiled before only because `BaseSchema` ends with `[key: string]: any`
(objectui#5155), so the docs page was the single place in the repo recording each
capability, and the one place with no mechanical guard.

Three declarations are deliberately not what "declare what is read" would produce
on its own, and each says so in its own doc comment:

- `CarouselSchema.opts` stays an OPEN bag rather than the docs page's
  `{ loop?, align? }` pair. The renderer forwards the whole bag to embla, so
  narrowing it to two keys would refuse authored documents that work today.
- `ContextMenuSchema.trigger` is OPTIONAL although the docs page shows it
  required; the renderer substitutes a placeholder, so trigger-less documents are
  legal today.
- `TreeViewSchema.onNodeClick` gets no zod VALUE SHAPE. It is invoked, not read as
  a value, so it cannot appear in an authored JSON document, and objectui#6152
  ruled that the class never gets one.

  ⭐ **AMENDED, and the amendment ships in this same release.** objectui#7804's
  `TreeViewSchema` slice gave the key a zod arm after all — a NAMED REFUSAL
  (`handlerKeyRefusal(key, 'runtime-slot', label)`), never a shape — because "no
  mirror entry" is not neutral under `BaseSchema.passthrough()`: it meant an
  authored `{ "type": "tree-view", "onNodeClick": { "action": "toast" } }` parsed
  GREEN, survived the parse, and reached a call site that expects a function.
  ⇒ the three clauses this bullet used to carry are no longer true of the code
  shipping beside it. The key is now a MEMBER of `TreeViewSchema.shape` and an
  authored value is refused BY NAME at path `onNodeClick`; it has LEFT
  `zod-mirror-parity.test.ts`'s `RuntimeOnlyDeclared` for that file's
  `KnownDrift`; and it is no longer "the first pair to sit there without also
  sitting in `UnmirroredDeclared`" — draining it emptied that difference, so
  `RuntimeOnlyDeclared` is now a SUBSET of `UnmirroredDeclared` and the union of
  the two equals `UnmirroredDeclared` itself. ⛔ objectui#6152's ruling is
  untouched by any of this: what the key still does not have, and never will, is a
  `z.function()` shape — no serialized document could satisfy one.

Two of the 13 declare a SECOND spelling for a slot that already had one —
`TextSchema.content` beside `value`, `TreeViewSchema.nodes` beside `data` — because
that is what the renderers read. Retiring either spelling is an ADR-0049
enforce-or-remove question and is deliberately not decided here.

⭐ **AMENDED — both `tree-view` alias questions have SINCE been decided, and the
decisions publish in this same release.** This paragraph used to end "Declaring
`nodes` also does not by itself make a `nodes`-only tree-view document legal:
`data` stays required on both faces." Neither half of that is true any more, on
either face:

- **A `nodes`-only `tree-view` document IS legal.** objectui#6939 made `data`
  optional, so the `nodes` spelling the renderer reads FIRST stands on its own
  (`6939-tree-view-nodes-mirror.md`, published beside this note). `bind` is read
  before either and is unchanged.
- **`data` is not required — it is REFUSED BY NAME.** objectui#6951 retired it
  under ADR-0049 on both faces: the TypeScript member is a `?: never` tombstone
  and the zod arm is a `retirementTombstone(...)` whose guidance points the author
  at `nodes` (`6951-tree-view-data-retired.md`, also published beside this note).
  `nodes` is `z.array(TreeNodeSchema).optional()`, and its own describe text
  records that a `nodes`-only document became legal at objectui#6939.

⛔ Nothing on the branch carrying this amendment falsified that sentence: it was
already untrue at that branch's base, and both cards that made it untrue are
closed. It is corrected here, rather than left to objectui#6150's owner, because
this note and theirs publish VERBATIM into the same CHANGELOG — a reader would
have met three paragraphs contradicting each other in one release.
