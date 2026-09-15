---
'@object-ui/types': minor
'@object-ui/components': patch
---

`AlertDialogSchema` retires `cancelLabel`, `confirmLabel` and `confirmVariant`
(objectui#7963, ADR-0049 enforce-or-remove; maintainer ruling 2026-09-10).
`cancelText` and `actionText` are the surviving spellings, and `confirmVariant`
has **no** survivor at all.

**Breaking, and graded `minor` by this repo's convention** (AGENTS.md — a
breaking change here is `minor`; a `major` would drag the whole 39-package fixed
group off `@objectstack`'s cadence). A document that authored any of the three
used to parse **green**; it now reds at that key.

**What was measured.** Tree-wide on `72bcd7783`, a point-access probe scores
`schema.cancelLabel` / `schema.confirmLabel` / `schema.confirmVariant` at
**0 / 0 / 0**, against firing controls on the very renderer under test
(`packages/components/src/renderers/overlay/alert-dialog.tsx`):
`schema.cancelText` = **15**, read at `:37`, and `schema.actionText` = **5**,
read at `:38`. The keys did reach the Radix root through the renderer's
rest-spread, so a grep alone was not a verdict — the DOM reading is, and it is
kept as a live pin: varying one key per fixture through the real renderer leaves
the normalised dialog HTML unmoved, against a `CHANNEL` control (`open`, unread
and live through that same spread) and a `WIRED` control (`cancelText` /
`actionText` drawing both footer buttons). The `AlertDialog` root renders a
context provider rather than an element, so an unknown prop is dropped before
reaching any node. An author who wrote the declared trio got an **empty footer**.

**A named refusal, not a deletion.** `BaseSchemaCore` ends `.passthrough()` and
the TypeScript `BaseSchema` closes with `[key: string]: any`, so a *dropped*
member key is kept, not refused — deleting the declarations would have left the
silent accept exactly as it was. Each key stays declared and unwritable:
`retirementTombstone()` on the Zod face, `?: never` on the TypeScript face. The
messages name the remedy.

| retired key | what to write instead |
| --- | --- |
| `cancelLabel` | `cancelText` |
| `confirmLabel` | `actionText` |
| `confirmVariant` | **nothing** — see below |

⚠️ `confirmVariant` has no replacement and its message says so plainly rather
than pointing at a key that does not do the same job: `cancelText` / `actionText`
are the footer's two *labels*, not a variant, and the node declares no variant
key at all (the confirm button is `AlertDialogAction`, which ships one fixed
`buttonVariants()` style). Whether that button should be styleable from metadata
is a separate question needing its own card.

**Nothing else moves.** These spellings are overloaded across the tree and every
other owner is a live key on a different declaration —
`FormSchema.cancelLabel`, `objectql.ts`'s `confirmLabel`, `plugin-designer`'s
`ConfirmDialog` React props, `plugin-grid`'s `def.confirmLabel`, and
`plugin-form`'s `ModalForm` / `DrawerForm`, which build a local `cancelLabel`
*from* `schema.cancelText`. None is an `AlertDialogSchema`; none is touched, and
a pin asserts it. No fixture, catalog schema, example app or doc fence authored
any of the three on an `alert-dialog` node, so no shipped document is stranded.
