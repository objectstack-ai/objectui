---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
---

An `onCardClick` supplied to an `object-kanban` board runs **once** per card
click instead of twice, and the published declaration of the key grows the
second parameter the surviving call actually delivers (objectui#9341, maintainer
ruling on the card, 2026-09-13).

**This carries a breaking behaviour change** — the `ObjectView` case below. It
ships `minor` because the repo has a single `fixed` group of 40 packages, so a
`major` on either package majors all forty; the scope is stated here rather than
encoded in the bump.

## `@object-ui/plugin-kanban` — one click, one call

`ObjectKanban` handed the host's function to `useNavigationOverlay` as its
`onRowClick` **and** called it again itself on the next line. `handleClick`
gives `onRowClick` full priority — it calls it and returns — so for a host that
supplied `onCardClick` and no `onRowClick`, one card click ran that one function
twice: a duplicate navigation, a duplicate analytics event or a double-open,
depending on what the handler did. The wrapper's second call is gone.

Of the two calls the deleted one was the poorer. `handleClick` forwards
`onRowClick(record, event)`, so a host can implement Cmd/Ctrl/middle-click; the
wrapper's call passed the record only. `onRowClick ?? onCardClick` is untouched,
so which handler wins is exactly what it was.

⚠️ **The breaking case, to check before upgrading.** A board embedded in an
`ObjectView` gets `onRowClick` from that parent, so the parent's handler already
won. What also happened was that the document's own `onCardClick` ran anyway —
once, through the wrapper. It now runs **zero** times there: the winner of
`onRowClick ?? onCardClick` answers the click outright. A host that relied on an
authored `onCardClick` firing alongside a parent `onRowClick` must move that
work into the parent's handler. Pinned as a reading, not left to be discovered,
in `packages/plugin-kanban/src/__tests__/cardClickFiresOnce-9341.test.tsx`.

## `@object-ui/types` — `ObjectKanbanSchema.onCardClick` declares two parameters

```ts
onCardClick?: (card: any, event?: any) => void;   // was: (card: any) => void
```

The surviving channel delivers `(record, event)`, so the one-parameter
declaration described only the call that was deleted. Growing an optional second
parameter is source-compatible in both directions — an existing one-argument
handler still type-checks, and code that stores the member in a one-argument
slot still compiles — and that claim is handed to `tsc` rather than asserted, in
the same pin file.

`event` is `any`, not `HandleClickModifiers`: that interface lives in
`@object-ui/react`, which depends on `@object-ui/types` and is named in no
dependency field of it. `BaseSchema`'s own `onClick` / `onChange` / `onSubmit`
already spell this exact situation the same way. What arrives at runtime is the
DOM click event `KanbanImpl` forwards, typed `React.MouseEvent` there.
