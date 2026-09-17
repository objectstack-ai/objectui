---
'@object-ui/types': minor
---

Declare `cardTitle` — the canonical card-title spelling — on `ObjectKanbanSchema`
(objectui#9606, director seat decision batch #150 item 3 letter 1, maintainer approved
2026-09-17).

Both published faces of the `object-kanban` arm now name the key: the zod mirror
`ObjectKanbanSchema` in `zod/objectql.zod.ts` and its TypeScript twin, the
`ObjectKanbanSchema` interface in `objectql.ts`. Both declare it OPTIONAL, at the same
requiredness the other face uses, so the two faces accept and refuse the same
documents. (Located and cited by SYMBOL: line addresses in `zod/objectql.zod.ts`
have drifted before, and this change is itself about a drifted mirror.)

⚠️ That agreement is held by a pin in this change, NOT by the `zod-mirror-parity`
ratchet. Measured while writing this: with `cardTitle` declared on the mirror and
deleted from the TypeScript twin, `type-check` still exited 0 — the ratchet has an
operator for declared-but-unmirrored and none for its reverse (objectui#9711). What
defends the twin's member is a `@ts-expect-error` on `cardTitle: 42` in
`object-kanban-card-title-9606.test.ts`, which `tsc` reports as an unused directive
(TS2578) the moment the member is deleted.

**What moves.** `@objectstack/spec` declares both `cardTitle` ("Field rendered as each
card title") and `titleField` ("Legacy fallback for `cardTitle` (the board reads
`cardTitle || titleField`). Prefer `cardTitle`") on `ObjectKanbanPropsSchema`;
`@object-ui/plugin-kanban`'s registration `inputs` declare both; `resolveKanbanTitleField`
reads `cardTitle` first; and this repository's own root README teaches `cardTitle`. This
mirror declared the LEGACY ALIAS ONLY, so the canonical key rode `BaseSchema`'s
`.passthrough()` unjudged. Measured with one probe before and after:
`safeValidateSchema({ type: 'object-kanban', objectName: 'tasks', groupBy: 'status',
cardTitle: 42 })` succeeded and KEPT the `42` before, and is refused by name after
(`cardTitle: Invalid input: expected string, received number`) — the protocol refused
that same document all along. A non-string reaching the validator did not stop there: it
reached `resolveKanbanTitleField`, which returns it as a record field name.

**Accepted set.** This NARROWS what the mirror accepts, to the spec's own accepted set —
an authored `cardTitle` must now be a string. If you author a non-string `cardTitle`,
the document was already being refused by `@objectstack/spec`; author a field name.

**⛔ `titleField` is NOT retired.** It stays declared as the legacy alias and
`titleField: 'name'` is still accepted — a mirror may not be narrower than the spec it
mirrors, and the spec still declares the alias. If the alias is ever retired, that starts
in `@objectstack/spec` on its own card.
