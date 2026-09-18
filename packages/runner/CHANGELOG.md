# @object-ui/runner

## 17.7.0

### Minor Changes

- 0ea7054: Remove 37 runtime dependencies that no file in the declaring package consumes, and gate
  the direction so the next one cannot land (objectui#8198).
  
  `check:phantom-deps` judges imports that are not declared; nothing judged the reverse,
  so a declaration could outlive its last consumer indefinitely. That is what happened to
  `recharts` in `@object-ui/components` after objectui#7397 deleted its only importer — it
  was removed by hand on objectui#7625, and nothing would have reported the next one. The
  new `pnpm check:unused-deps` asks the reverse question over `dependencies` and
  `optionalDependencies` of every released package.
  
  **Potentially breaking, for consumers relying on hoisting.** Nothing these packages ship
  changes: their Vite `external` predicates are path-based and never read `dependencies`,
  so no built artifact moves. What changes is the install graph — a project that imports
  one of the removed packages while depending only on the ObjectUI package that used to
  drag it in will no longer resolve it. Declare it directly; that is the correct
  dependency edge in either case. The removals, by package:
  
  - `@object-ui/plugin-designer`: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@object-ui/fields`
  - `@object-ui/plugin-chatbot`: `react-markdown`, `react-syntax-highlighter`, `remark-gfm` (and the orphaned `@types/react-syntax-highlighter`)
  - `@object-ui/plugin-report`: `@object-ui/plugin-grid`, `clsx`, `react-i18next`, `tailwind-merge`
  - `@object-ui/plugin-map`: `@objectstack/spec`, `lucide-react`, `zod`
  - `@object-ui/runner`: `class-variance-authority`, `clsx`, `tailwind-merge`
  - `@object-ui/core`: `lodash`, `zod`
  - `@object-ui/layout`: `clsx`, `tailwind-merge`, and `react-dom` — which it pinned at an exact version in `dependencies` while also declaring it as a peer range, i.e. a library hard-depending on the renderer it asks its host to supply
  - `@object-ui/plugin-dashboard`: `clsx`, `tailwind-merge`, and the same `react-dom` defect
  - `@object-ui/plugin-ai`: `@object-ui/react`, `clsx`, `tailwind-merge`
  - `@object-ui/fields`: `clsx`, `tailwind-merge`
  - `@object-ui/console`: `@object-ui/react-runtime`, `sucrase`
  - `@object-ui/auth`: `@object-ui/types`
  - `@object-ui/plugin-calendar`: `@object-ui/fields`
  - `@object-ui/plugin-editor`, `@object-ui/plugin-markdown`: `@object-ui/react`
  - `@object-ui/react`: `react-hook-form`
  
  Every one was verified by a whole-package grep before removal — the name appeared nowhere
  under the package but its own manifest and CHANGELOG — and the whole workspace builds,
  type-checks and tests green afterwards.

### Patch Changes

- adb2a86: The standalone runner renders `AppAction.items` from its declared type only, which
  makes `AppActionSchema.onClick`'s retirement message true again (objectui#6854,
  maintainer ruling of 2026-09-05, option B2).
  
  `AppAction.items` is `AppMenuItem[]`, and the zod mirror parses it with the legacy
  `MenuItemSchema`, which declared neither `onClick` nor `shortcut` when this change was
  made. (`shortcut` has since become a declared refusal there — objectui#7719 — while
  `onClick` remains undeclared on that mirror and is still dropped in silence.)
  `LayoutRenderer` reached both through `as any`, past the type it was handed, and
  that left three mutually exclusive signals about the same key: the TypeScript face
  said `?: never`, the validator's refusal said "no renderer reads this key, so
  nothing could ever run it", and a renderer read it. An agent or a reader could
  believe any one of the three and be contradicted by the other two.
  
  **No published accept set moves and no exported symbol changes.** `AppAction.items`
  is NOT re-typed (the alternative was measured and refused: it would have carried a
  breaking migration for `path` / `href` / `badge` / `type` and the divider spelling,
  for a capability with no measured consumer). The refusal message itself is unchanged
  — it is shared by 22 other retired handler keys, and deleting the cast is what makes
  its sentence true rather than restating it.
  
  - `@object-ui/runner`: `LayoutRenderer` no longer reads `onClick` or `shortcut` on a
    `type: 'user'` action's `items`. The `onClick` branch was an empty body and could
    never run a JSON value; the `shortcut` read rendered a `DropdownMenuShortcut` from
    a key the mirror stripped in silence at the time, so no validated document could
    reach it. (objectui#7719 has since replaced that silent strip with a named refusal;
    either way the read was unreachable, which is what made deleting it a cleanup.) A
    census of every JSON and TypeScript app document in this repository found zero
    authors of either key (positive controls recorded on the issue).
  - `@object-ui/types`: the rationale comments on `AppAction.onClick` and
    `AppActionSchema.onClick` said "nothing reads `AppComponentSchema.actions[]`".
    That was false — the runner renders both the `'button'` and the `'user'` arm.
    Corrected to what was measured: `actions[]` is read, `onClick` is not.
  
  Whether `shortcut` should become authorable on `AppAction.items` was a separate
  contract question, filed as objectui#7719 and since answered: it does not become
  authorable, and the mirror refuses it by name instead of stripping it.
- 76573a1: Fix every `@source` path in the runner's Tailwind entry, and keep test files out
  of its published stylesheet (objectui#8454).
  
  `packages/runner/src/index.css` is a published input: this package is
  `private: false` with `files: ["dist"]`, so what it compiles to is bytes a
  consumer downloads and serves. All five of its `@source` lines were wrong by one
  path segment. Tailwind resolves a relative `@source` against the directory of the
  entry CSS — `packages/runner/src/` — so `./src/**` meant
  `packages/runner/src/src` and `../../packages/<pkg>/src` meant
  `packages/packages/<pkg>/src`. A glob whose base directory does not exist scans
  nothing and raises no error, so the file read as if it declared its inputs while
  declaring none: deleting all five lines produced a byte-identical artifact.
  
  What kept the sheet non-empty was Tailwind's automatic source detection, whose
  base defaults to the process CWD — `packages/runner`, where `pnpm build` runs.
  That covers this package's own tree and nothing else, so every utility belonging
  to `@object-ui/components`, `@object-ui/react`, `@object-ui/plugin-kanban` and
  `@object-ui/plugin-charts` was missing from the shipped app. Measured from the
  package directory, repairing the four sibling paths takes the compiled sheet from
  228 to 1456 selectors (21 kB to 136 kB): `bg-popover`, `bg-accent`,
  `bg-destructive`, `animate-out` and 1224 more had no source anywhere.
  
  The same automatic root also swept this package's own test files into the
  published bytes. Two `@source not` lines — the spelling
  `packages/plugin-kanban/src/index.css` already uses, anchored one level up
  because this entry scans four sibling packages — remove nine test-sourced
  classes, several of them ordinary English words lifted out of prose comments
  (`paused`, `invert`, `flex-nowrap`).
  
  `patch`: this package exposes no importable surface at all (no `main`, `module`,
  `types` or `exports` — it publishes a built application under `dist`), so nothing
  a consumer imports changes shape. The nine removed classes are unreachable from
  the app's own markup by construction, which is why the scan never had a shipped
  source for them.
- adf5812: Four node type keys retire, and the kanban and gantt families converge on their
  `object-*` spellings: `kanban` (objectui#8802), `kanban-ui` and `kanban-enhanced`
  (objectui#8257), and `gantt` (objectui#8008). All four were ruled by the
  maintainer in one batch on 2026-09-09.
  
  **⛔ No stored document moves.** The strings `kanban` and `gantt` name two
  different things at two different layers, and only one of them is retiring:
  
  | layer | value | who writes it | retired? |
  | --- | --- | --- | --- |
  | stored `NamedListView.type` | `"kanban"`, `"gantt"` | `CreateViewDialog`, persisted per tenant | **no — untouched** |
  | node type key | `kanban`, `gantt` | hand-authored JSON | **yes** |
  
  `ObjectView`'s `switch (viewType)` maps a stored view type onto the node type it
  renders, and it already emitted `object-kanban` and `object-gantt` — as it does
  for all twelve stored view types. So every kanban and gantt view any user ever
  created through the console already renders through the surviving spelling.
  Nothing in a tenant database changes, and ⛔ nothing should be migrated there.
  
  **What each retirement was, measured.** Three of the four were
  registration-only: no schema face in `@object-ui/types` ever declared
  `kanban-ui`, `kanban-enhanced` or `gantt` as a component node type, so
  unregistering is the whole retirement. The bare `kanban` key was the exception —
  it had a declared arm on both faces (`KanbanSchema` in `complex.ts` and its Zod
  mirror), and a plain deletion there would have been the objectui#7664 failure:
  `BaseSchema` is `.passthrough()`, so a document naming a dropped key validates
  green and renders nothing. It therefore retires as a **named refusal**: the Zod
  union keeps an arm claiming the literal and answers a `{ "type": "kanban" }`
  document with a message naming `object-kanban` as the remedy, while the
  TypeScript half is the absence of the arm from `ComplexSchema` and of the key
  from `SchemaRegistry`, so `tsc` refuses it at the authoring site.
  
  **⭐ This closes objectui#8818's `objectFields` hole — for that ENTRY, not for
  the class.** `SchemaRenderer` strips a fixed enumerated metadata list and
  spreads the rest as React props; `objectFields` is not on that list, and
  `KanbanRenderer` — the component the `kanban-ui` key resolved to — declares
  `objectFields` as a real prop, so an authored value reached the predicate layer
  with no schema face judging it. With the registration gone, no authored node
  reaches that component through the registry. ⚠️ The **class** is still open: the
  hole returns the moment another registered renderer declares an `objectFields`
  prop. objectui#8818's option (a) — stripping at the `SchemaRenderer` boundary —
  is what would close the class.
  
  **⚠️ What the `kanban` arm took with it, stated because it is the cost of this
  change.** That arm was the only schema face that ever declared `columns`,
  `cardTitle`, `swimlaneField`, `grouping` and `navigation`, the only one that
  refused `allowCollapse` / `cardTemplates` / `columnWidths` / `titleField` /
  `draggable` / `onColumnAdd` / `onCardAdd` by name, and — through
  `columns: KanbanColumn[]` — the only one that judged a lane's `cards`
  (objectui#6939).
  
  ⭐ **The sentence that stood here — «The surviving `ObjectKanbanSchema` face
  declares none of them» — is retired, and the two reasons it failed are DIFFERENT
  defects (objectui#9713).** It is replaced by a dated reading rather than silently
  overwritten, because half of it was true when written and erasing that would be a
  false record of its own:
  
  | key named just above | on `ObjectKanbanSchema` when this entry was written (`adf581278`, 2026-09-10) | on `main`, 2026-09-17 | what moved |
  | --- | --- | --- | --- |
  | `columns` | not declared | **declared** | objectui#8913 (PR objectui#8989), six hours after this entry was written |
  | `cardTitle` | not declared | **declared** | objectui#9606 (PR objectui#9709) |
  | `titleField` | **declared** | **declared** | nothing — the sentence was never true of this key |
  | `allowCollapse` | **declared**, a live `z.boolean().optional()` | **declared**, as a `retirementTombstone()` | objectui#8801 retired it; it was declared on this face throughout |
  | `swimlaneField`, `grouping`, `navigation`, `cardTemplates`, `columnWidths`, `draggable`, `onColumnAdd`, `onCardAdd`, and a lane's `cards` | not declared | not declared | nothing |
  
  ⇒ For `columns` and `cardTitle` the claim **ROTTED**: it was true on 2026-09-10 and
  was falsified afterwards by cards that had no reason to read this file. For
  `titleField` and `allowCollapse` it was **BORN FALSE**: those two are named above as
  keys the `kanban` arm refused BY NAME — which the surviving face indeed does not do
  — but the surviving face declared both of them the whole time, and «declares none of
  them» said otherwise. ⛔ Do not restate any of this in the present tense: a pending
  entry publishes verbatim into the CHANGELOG, and an undated present-tense claim
  about another file is the construction that failed here.
  
  ⛔ Nothing about an `object-kanban` document changes: it was never judged by the
  `kanban` arm, so all of those keys have always ridden `BaseSchema`'s index
  signature there. What is gone is the `kanban` document that had them. Declaring
  them on `ObjectKanbanSchema` would WIDEN a published accept set, which is a
  maintainer ruling and not part of this one; every one of these readings is
  pinned where it can be seen rather than left to be rediscovered.
  
  **Migrating.** Replace `"type": "kanban"` with `"type": "object-kanban"` and
  `"type": "gantt"` with `"type": "object-gantt"` in hand-authored documents. The
  `object-kanban` face requires `groupBy` and one of `bind` / `data` /
  `objectName`; a purely static board (lanes carrying their own cards, no record
  source) adds `"groupBy"` and `"data": []`. `kanban-ui` and `kanban-enhanced`
  have no authored documents anywhere in this repository to migrate.
  
  **⚠️ The namespaced spellings retire with the registrations — `view:kanban` and
  `view:gantt` are the same two keys.** `ComponentRegistry.register(type, C,
  { namespace })` stores BOTH `namespace:type` and a bare-`type` fallback, so
  every one of these keys had a namespaced twin that goes with it:
  
  | retired spelling | namespaced twin | author instead |
  | --- | --- | --- |
  | `kanban` | `view:kanban` | `object-kanban` |
  | `gantt` | `view:gantt` | `object-gantt` |
  | `kanban-ui` | `plugin-kanban:kanban-ui` | `object-kanban` |
  | `kanban-enhanced` | `plugin-kanban:kanban-enhanced` | `object-kanban` |
  
  Both spellings are pinned as gone, each against a firing control on the
  surviving key, in `plugin-kanban/src/__tests__/kanban-family-registry-keys-retired-8257.test.ts`
  and `plugin-gantt/src/__tests__/bare-gantt-node-key-retired-8008.test.ts`.
  
  **What an unmigrated `view:kanban` / `view:gantt` node now renders depends on
  the host.** In `apps/console` it renders the protocol **placeholder** panel, not
  the OBJUI-001 "Unknown component type" error: the console calls the opt-in
  `registerPlaceholders()` (`@object-ui/components`, `renderers/placeholders.tsx`)
  *after* its plugin registrations, `view:kanban` and `view:gantt` are both in
  that file's `PROTOCOL_COMPONENTS` list, and the placeholder only claims a key
  nothing else has taken — which, until this change, `@object-ui/plugin-kanban`
  and `@object-ui/plugin-gantt` had. In every other host, which does not call that
  bootstrap, the same node renders OBJUI-001.
  
  **⚠️ `objectui check` will NOT flag either namespaced spelling.** The CLI's
  `known-schema-types.ts` is generated from the repository's real registration
  calls, and the placeholder registration is a real one — so `view:kanban` and
  `view:gantt` are still on that list and still validate green, while the node
  renders a placeholder rather than a board. The bare `kanban` / `gantt` entries
  DID leave the generated list; only the namespaced pair survives, and only
  because of the placeholder. Grep your documents for the namespaced spellings
  directly; do not rely on `objectui check` to find them.
  
  `KanbanRenderer` is still exported from this package's entry point
  (`@object-ui/plugin-kanban`); only its registry key is gone. ⚠️ `KanbanEnhanced`
  is a different case, and the earlier draft of this note stated it wrongly: this
  package's `exports` map has exactly two entries — `.` and `./style.css` — and
  the barrel never re-exported the component, so
  `@object-ui/plugin-kanban/KanbanEnhanced` has never been a resolvable specifier
  for a consumer. With `kanban-enhanced` unregistered, `KanbanEnhanced.tsx` has
  zero non-test importers. ⛔ The file is deliberately left in place: deleting
  published-but-unreachable source is a further narrowing and needs its own
  maintainer ruling, which this change does not have.
  
  **⚠️ `@object-ui/sdui-parser`: `QUICK_ADD_HOST_TYPES` loses `kanban` with the
  registration.** The `inert-quick-add` diagnostic (objectui#8285) named the two
  tags `ObjectKanbanRenderer` answered to; one of them retires here, so the set is
  now `{ 'object-kanban' }`. ⛔ Nothing is silently dropped by that narrowing, and
  this is measured rather than argued: `checkKanbanQuickAdd` has exactly one call
  site — `validate.ts`'s per-prop walk — and that walk runs only in the branch
  where the manifest RESOLVED the tag. A tag no registration produces is answered
  one level up by `unknown-component`, an **error**, and its props are never
  walked, so on a manifest built from the live registry a `<kanban quickAdd>` node
  draws `error/unknown-component` and nothing else, against a firing control on
  `<object-kanban quickAdd>` that still draws `warning/inert-quick-add`. Keeping
  `kanban` in the set would have been reachable only through a hand-built manifest
  declaring a component of that name — which, after this retirement, is somebody
  else's component, and the message asserts things about `ObjectKanban` that would
  be false of it. This supersedes the `kanban` half of the objectui#8285 entry.
  
  **The diagnostic's remedy text moves from a tag to a component.** It used to end
  "render `<kanban-ui>` from a React host that passes `onQuickAdd`". That sentence
  is falsified by this change: `kanban-ui` is no longer a node type key, so a page
  written to the old advice draws `unknown-component`. It now names
  `KanbanRenderer` from `@object-ui/plugin-kanban` — still exported, still
  forwarding both halves by identity — which is the surviving way to get the pair.
  `content/docs/plugins/plugin-kanban.mdx` says the same thing the same way.
- Updated dependencies [64dae8e]
- Updated dependencies [06a8af5]
- Updated dependencies [6a91586]
- Updated dependencies [a04d7c6]
- Updated dependencies [5ccc500]
- Updated dependencies [9801765]
- Updated dependencies [460575f]
- Updated dependencies [d796c8d]
- Updated dependencies [1b1d772]
- Updated dependencies [d88e20f]
- Updated dependencies [2d7304d]
- Updated dependencies [062943f]
- Updated dependencies [636b236]
- Updated dependencies [4172589]
- Updated dependencies [64d624d]
- Updated dependencies [053fdc8]
- Updated dependencies [ae476b8]
- Updated dependencies [39f4309]
- Updated dependencies [d2fb6ef]
- Updated dependencies [7cd3987]
- Updated dependencies [ee3b878]
- Updated dependencies [e304a4e]
- Updated dependencies [490d9a9]
- Updated dependencies [fc62bb4]
- Updated dependencies [41df893]
- Updated dependencies [7c96c94]
- Updated dependencies [3e853c9]
- Updated dependencies [00f3eb5]
- Updated dependencies [1ec291c]
- Updated dependencies [453dbaa]
- Updated dependencies [f8cdbf2]
- Updated dependencies [69a2163]
- Updated dependencies [24e027e]
- Updated dependencies [2c3cd1b]
- Updated dependencies [e176053]
- Updated dependencies [e30ed15]
- Updated dependencies [90665e0]
- Updated dependencies [194fae1]
- Updated dependencies [7e19d03]
- Updated dependencies [546ddf7]
- Updated dependencies [864154e]
- Updated dependencies [b023625]
- Updated dependencies [75bd83d]
- Updated dependencies [a76b18c]
- Updated dependencies [44d075b]
- Updated dependencies [40c479a]
- Updated dependencies [971d387]
- Updated dependencies [ee851c3]
- Updated dependencies [6414dfd]
- Updated dependencies [a8d5c71]
- Updated dependencies [905b21f]
- Updated dependencies [88e9109]
- Updated dependencies [2c45966]
- Updated dependencies [db3a600]
- Updated dependencies [6fd2cf7]
- Updated dependencies [52a43de]
- Updated dependencies [e4559d1]
- Updated dependencies [2c71482]
- Updated dependencies [b3d562c]
- Updated dependencies [129bcc5]
- Updated dependencies [a26b9e4]
- Updated dependencies [5ef9c4f]
- Updated dependencies [46f0bb4]
- Updated dependencies [8ec11e1]
- Updated dependencies [6f81384]
- Updated dependencies [22ba927]
- Updated dependencies [7d2a689]
- Updated dependencies [f8c70f4]
- Updated dependencies [8f1d995]
- Updated dependencies [f9c34df]
- Updated dependencies [dddb942]
- Updated dependencies [29754cf]
- Updated dependencies [3c2b6f7]
- Updated dependencies [6e88630]
- Updated dependencies [b84dc18]
- Updated dependencies [ac8abb0]
- Updated dependencies [9d86e1d]
- Updated dependencies [99a3c2d]
- Updated dependencies [5961030]
- Updated dependencies [f24de8b]
- Updated dependencies [c8ea8af]
- Updated dependencies [3190414]
- Updated dependencies [4e480f5]
- Updated dependencies [38a123c]
- Updated dependencies [299102e]
- Updated dependencies [30c73cd]
- Updated dependencies [830ed58]
- Updated dependencies [d7acad6]
- Updated dependencies [45a9aeb]
- Updated dependencies [713db46]
- Updated dependencies [c71e14d]
- Updated dependencies [bf3a03c]
- Updated dependencies [748494b]
- Updated dependencies [5967be0]
- Updated dependencies [831be72]
- Updated dependencies [29cb85b]
- Updated dependencies [3e028c8]
- Updated dependencies [d0889e2]
- Updated dependencies [ce503e5]
- Updated dependencies [f20dcf0]
- Updated dependencies [12402a9]
- Updated dependencies [aff3d7a]
- Updated dependencies [4ca30d0]
- Updated dependencies [7a5da14]
- Updated dependencies [2c1c967]
- Updated dependencies [9486ac6]
- Updated dependencies [9486ac6]
- Updated dependencies [4d5f9b4]
- Updated dependencies [d6ceb8d]
- Updated dependencies [dc4365c]
- Updated dependencies [e321d52]
- Updated dependencies [4c68077]
- Updated dependencies [7977ff9]
- Updated dependencies [3beef6d]
- Updated dependencies [06b8c42]
- Updated dependencies [46b9bc9]
- Updated dependencies [b97790a]
- Updated dependencies [7c9b044]
- Updated dependencies [d47de51]
- Updated dependencies [3fe6463]
- Updated dependencies [31ab372]
- Updated dependencies [846889b]
- Updated dependencies [26896c6]
- Updated dependencies [67fc3b0]
- Updated dependencies [33a3b3c]
- Updated dependencies [b87f15b]
- Updated dependencies [045d20b]
- Updated dependencies [a2d2515]
- Updated dependencies [c18d099]
- Updated dependencies [adb2a86]
- Updated dependencies [03380aa]
- Updated dependencies [4562ea5]
- Updated dependencies [3619792]
- Updated dependencies [3561bd2]
- Updated dependencies [bf97b98]
- Updated dependencies [b0d308d]
- Updated dependencies [40f34b4]
- Updated dependencies [8063bcb]
- Updated dependencies [b74a859]
- Updated dependencies [d4493fd]
- Updated dependencies [240b80f]
- Updated dependencies [77cb489]
- Updated dependencies [bfaa158]
- Updated dependencies [777e5c6]
- Updated dependencies [0c386dd]
- Updated dependencies [9e37d9b]
- Updated dependencies [5ad86dd]
- Updated dependencies [16a725f]
- Updated dependencies [4dfdcc3]
- Updated dependencies [6a449fc]
- Updated dependencies [446d93d]
- Updated dependencies [ecd9cb2]
- Updated dependencies [f08bcd9]
- Updated dependencies [98d4108]
- Updated dependencies [0e3b3be]
- Updated dependencies [a29ae2d]
- Updated dependencies [00d3f09]
- Updated dependencies [4388f71]
- Updated dependencies [0b1ac58]
- Updated dependencies [c93b4d5]
- Updated dependencies [c1fe272]
- Updated dependencies [3cab570]
- Updated dependencies [8ad218d]
- Updated dependencies [3e41187]
- Updated dependencies [5f78953]
- Updated dependencies [639114c]
- Updated dependencies [1f31d3a]
- Updated dependencies [d1842ab]
- Updated dependencies [0349555]
- Updated dependencies [78ca238]
- Updated dependencies [40c4711]
- Updated dependencies [351eb31]
- Updated dependencies [20c04b2]
- Updated dependencies [48c19bd]
- Updated dependencies [a6d8b8d]
- Updated dependencies [b652514]
- Updated dependencies [adbda1b]
- Updated dependencies [adbda1b]
- Updated dependencies [e8c553b]
- Updated dependencies [2e32ed4]
- Updated dependencies [7c3df8f]
- Updated dependencies [7c3df8f]
- Updated dependencies [b9f5ff1]
- Updated dependencies [e75f4c9]
- Updated dependencies [19f1639]
- Updated dependencies [bb459ea]
- Updated dependencies [4704aa4]
- Updated dependencies [47547d0]
- Updated dependencies [1bee5d0]
- Updated dependencies [858cd72]
- Updated dependencies [c4f775a]
- Updated dependencies [554f2b6]
- Updated dependencies [72f55c9]
- Updated dependencies [26e06d7]
- Updated dependencies [6ca6e12]
- Updated dependencies [669d71b]
- Updated dependencies [ed27d7c]
- Updated dependencies [52c8cf7]
- Updated dependencies [7cdd2b9]
- Updated dependencies [52c8cf7]
- Updated dependencies [acb5797]
- Updated dependencies [e859ad0]
- Updated dependencies [7bf244b]
- Updated dependencies [ed4a2f1]
- Updated dependencies [0dc2c93]
- Updated dependencies [f0bb9fa]
- Updated dependencies [d327b9c]
- Updated dependencies [ff79d38]
- Updated dependencies [81a2eb1]
- Updated dependencies [00d2fa6]
- Updated dependencies [c6198c2]
- Updated dependencies [2f61238]
- Updated dependencies [51eb515]
- Updated dependencies [c354ce5]
- Updated dependencies [8fe8e5c]
- Updated dependencies [9ae871d]
- Updated dependencies [efbd566]
- Updated dependencies [9587fc9]
- Updated dependencies [e62c44e]
- Updated dependencies [daf9d57]
- Updated dependencies [c15d7ec]
- Updated dependencies [5d0876c]
- Updated dependencies [f7ace0a]
- Updated dependencies [b041b9c]
- Updated dependencies [ce2aaef]
- Updated dependencies [544ecba]
- Updated dependencies [2ce2612]
- Updated dependencies [bc640ec]
- Updated dependencies [da6e191]
- Updated dependencies [3e377c9]
- Updated dependencies [a3eb5d0]
- Updated dependencies [4ce14f1]
- Updated dependencies [2af1fa7]
- Updated dependencies [2af1fa7]
- Updated dependencies [01c27c4]
- Updated dependencies [c14d3a0]
- Updated dependencies [caf477f]
- Updated dependencies [f6375da]
- Updated dependencies [967e5d8]
- Updated dependencies [a4611b3]
- Updated dependencies [20316ba]
- Updated dependencies [d3499b3]
- Updated dependencies [0ead1f6]
- Updated dependencies [c9f9bae]
- Updated dependencies [18897a4]
- Updated dependencies [8b7ea39]
- Updated dependencies [dcbf0b2]
- Updated dependencies [52cac38]
- Updated dependencies [a480f79]
- Updated dependencies [f08d1a8]
- Updated dependencies [64a252d]
- Updated dependencies [786bc91]
- Updated dependencies [75fca96]
- Updated dependencies [7ca6ddd]
- Updated dependencies [f1cd290]
- Updated dependencies [5a41ce7]
- Updated dependencies [8d50bc2]
- Updated dependencies [604476d]
- Updated dependencies [d1bebb0]
- Updated dependencies [335abea]
- Updated dependencies [edea22a]
- Updated dependencies [0f5cadf]
- Updated dependencies [4f9f1ee]
- Updated dependencies [12b5992]
- Updated dependencies [c842594]
- Updated dependencies [290de37]
- Updated dependencies [8c8da45]
- Updated dependencies [cf1d29e]
- Updated dependencies [1bd79c8]
- Updated dependencies [ad852b6]
- Updated dependencies [7fb22a1]
- Updated dependencies [ad66d79]
- Updated dependencies [0758bd8]
- Updated dependencies [ee4d19f]
- Updated dependencies [496d31d]
- Updated dependencies [0ea7054]
- Updated dependencies [2d80456]
- Updated dependencies [9a853f2]
- Updated dependencies [cb847fd]
- Updated dependencies [ee70287]
- Updated dependencies [3e98e13]
- Updated dependencies [fc32921]
- Updated dependencies [4eaa835]
- Updated dependencies [8f9d87a]
- Updated dependencies [b1777ae]
- Updated dependencies [5591f03]
- Updated dependencies [4fa0eb9]
- Updated dependencies [24d1edd]
- Updated dependencies [8a4a106]
- Updated dependencies [645087c]
- Updated dependencies [33f4a19]
- Updated dependencies [4a292d2]
- Updated dependencies [5323168]
- Updated dependencies [841dd2b]
- Updated dependencies [dacb402]
- Updated dependencies [91facae]
- Updated dependencies [b38014e]
- Updated dependencies [474797d]
- Updated dependencies [704e695]
- Updated dependencies [18b6a75]
- Updated dependencies [a407bd6]
- Updated dependencies [317dbce]
- Updated dependencies [3a43a15]
- Updated dependencies [868e825]
- Updated dependencies [f76f436]
- Updated dependencies [b6d07df]
- Updated dependencies [f3ee584]
- Updated dependencies [ce45a03]
- Updated dependencies [421544b]
- Updated dependencies [fb01022]
- Updated dependencies [e9d9212]
- Updated dependencies [ecfb693]
- Updated dependencies [abc1b18]
- Updated dependencies [81a51db]
- Updated dependencies [67749c7]
- Updated dependencies [507b61b]
- Updated dependencies [512c84b]
- Updated dependencies [c300267]
- Updated dependencies [154fe2a]
- Updated dependencies [fb3a101]
- Updated dependencies [d4733f2]
- Updated dependencies [1570eac]
- Updated dependencies [f391ede]
- Updated dependencies [8600557]
- Updated dependencies [f5cfbbd]
- Updated dependencies [f5cfbbd]
- Updated dependencies [8b532cb]
- Updated dependencies [64c3cdd]
- Updated dependencies [4d65991]
- Updated dependencies [c42554e]
- Updated dependencies [555b4ec]
- Updated dependencies [1ccfc23]
- Updated dependencies [542718f]
- Updated dependencies [7f27bc5]
- Updated dependencies [0a174f3]
- Updated dependencies [f95b140]
- Updated dependencies [541ce4e]
- Updated dependencies [bb383e8]
- Updated dependencies [d1865d2]
- Updated dependencies [f1190b0]
- Updated dependencies [561abef]
- Updated dependencies [6a4680b]
- Updated dependencies [c3a4273]
- Updated dependencies [abf710d]
- Updated dependencies [093af32]
- Updated dependencies [326a6e5]
- Updated dependencies [1bd1be7]
- Updated dependencies [d234fa9]
- Updated dependencies [adf5812]
- Updated dependencies [de1a126]
- Updated dependencies [2f6b2bf]
- Updated dependencies [2028b31]
- Updated dependencies [63601ab]
- Updated dependencies [c372b29]
- Updated dependencies [152f0a7]
- Updated dependencies [8693b85]
- Updated dependencies [e82dad1]
- Updated dependencies [84defab]
- Updated dependencies [681d3f1]
- Updated dependencies [f3bc481]
- Updated dependencies [b79aac2]
- Updated dependencies [93fc0e7]
- Updated dependencies [a4b723f]
- Updated dependencies [2b10ca0]
- Updated dependencies [7db4a81]
- Updated dependencies [19a0b0e]
- Updated dependencies [f8e3e9a]
- Updated dependencies [b9d47ec]
- Updated dependencies [3b6bc69]
- Updated dependencies [6214db6]
- Updated dependencies [6732df4]
- Updated dependencies [fe9e0d0]
- Updated dependencies [63fb72c]
- Updated dependencies [1e0e46a]
- Updated dependencies [3dd533f]
- Updated dependencies [279e48e]
- Updated dependencies [8700d6d]
- Updated dependencies [8db2a0f]
- Updated dependencies [689953a]
- Updated dependencies [30443fb]
- Updated dependencies [8d3dbb2]
- Updated dependencies [efc1c9c]
- Updated dependencies [da45e6b]
- Updated dependencies [7533465]
- Updated dependencies [835f0f3]
- Updated dependencies [a9d97be]
- Updated dependencies [3dd533f]
- Updated dependencies [9ba7e9c]
- Updated dependencies [729e851]
- Updated dependencies [96919a4]
- Updated dependencies [345e24a]
- Updated dependencies [20b507a]
- Updated dependencies [2e471dc]
- Updated dependencies [6748587]
- Updated dependencies [be50942]
- Updated dependencies [53374dc]
- Updated dependencies [7cbc724]
- Updated dependencies [7098eed]
- Updated dependencies [3df7c5c]
- Updated dependencies [8524372]
- Updated dependencies [72d6587]
- Updated dependencies [a272a4f]
- Updated dependencies [55f39ee]
- Updated dependencies [502eb58]
- Updated dependencies [0ce32d5]
- Updated dependencies [0970a0e]
- Updated dependencies [e427e9c]
- Updated dependencies [bbc9dc3]
- Updated dependencies [1ef89c0]
- Updated dependencies [ac716ff]
- Updated dependencies [20f3e65]
- Updated dependencies [bbba098]
- Updated dependencies [bbe57fd]
- Updated dependencies [f7fcc2c]
- Updated dependencies [f0f4d6c]
- Updated dependencies [78a9c67]
- Updated dependencies [dea17b4]
- Updated dependencies [06611e4]
- Updated dependencies [66abbde]
- Updated dependencies [6bca0e4]
- Updated dependencies [81c0bc4]
- Updated dependencies [3c76801]
- Updated dependencies [60500cb]
- Updated dependencies [2fcefb9]
- Updated dependencies [b55a346]
- Updated dependencies [065bba7]
- Updated dependencies [dd19463]
- Updated dependencies [6791717]
- Updated dependencies [3f983f4]
- Updated dependencies [894d103]
- Updated dependencies [100547e]
- Updated dependencies [6d1c155]
- Updated dependencies [d7573b3]
- Updated dependencies [bf3edfe]
- Updated dependencies [2c8474c]
- Updated dependencies [0e05aac]
- Updated dependencies [ae61ad4]
- Updated dependencies [5aed9e4]
- Updated dependencies [83c77dc]
- Updated dependencies [18a8e7d]
- Updated dependencies [e7957ab]
- Updated dependencies [f7e34ca]
- Updated dependencies [e719ebd]
- Updated dependencies [f9e4f91]
- Updated dependencies [6ef48b1]
- Updated dependencies [fa429cf]
- Updated dependencies [ed8df3e]
- Updated dependencies [5eddeeb]
- Updated dependencies [fe76ece]
- Updated dependencies [8e74b27]
- Updated dependencies [7102b20]
- Updated dependencies [8ebd57f]
- Updated dependencies [617707a]
- Updated dependencies [58770f3]
- Updated dependencies [aefe428]
- Updated dependencies [485f096]
- Updated dependencies [7357447]
- Updated dependencies [199d31b]
- Updated dependencies [b655a9d]
- Updated dependencies [3e01cb5]
- Updated dependencies [7138bc1]
- Updated dependencies [cef27e2]
- Updated dependencies [4e8622b]
- Updated dependencies [dffd752]
- Updated dependencies [06973aa]
- Updated dependencies [50798f3]
- Updated dependencies [105f3c5]
- Updated dependencies [3ccd9e8]
- Updated dependencies [689b979]
- Updated dependencies [f20a111]
- Updated dependencies [c6ae7b2]
- Updated dependencies [c70f865]
- Updated dependencies [d6fe1e1]
- Updated dependencies [e546222]
- Updated dependencies [fd13f52]
- Updated dependencies [d7bd274]
- Updated dependencies [98c3a74]
- Updated dependencies [ebce5a3]
- Updated dependencies [9d9040d]
- Updated dependencies [0fce2ef]
- Updated dependencies [42df928]
- Updated dependencies [0e2ddd4]
- Updated dependencies [b7479ab]
- Updated dependencies [9850c6e]
- Updated dependencies [b2ea297]
- Updated dependencies [5b5a5c3]
- Updated dependencies [6c5ee71]
- Updated dependencies [14582b8]
- Updated dependencies [51e144e]
- Updated dependencies [6f017e9]
- Updated dependencies [ab92940]
- Updated dependencies [a691c0b]
- Updated dependencies [0b1326d]
- Updated dependencies [af3861f]
- Updated dependencies [515f171]
- Updated dependencies [1f4e029]
- Updated dependencies [4f14ad7]
- Updated dependencies [258d264]
- Updated dependencies [cac64b3]
- Updated dependencies [8033ad1]
- Updated dependencies [fa140b8]
- Updated dependencies [71cba28]
- Updated dependencies [190fbd0]
- Updated dependencies [c00bf28]
- Updated dependencies [93127bd]
- Updated dependencies [f2158ec]
- Updated dependencies [759606e]
- Updated dependencies [72ffc34]
- Updated dependencies [51f3d8d]
- Updated dependencies [bf28341]
- Updated dependencies [78cbdb5]
- Updated dependencies [b7543a9]
- Updated dependencies [6c6cee7]
- Updated dependencies [42887e0]
- Updated dependencies [83fe6e7]
- Updated dependencies [d1ab06f]
- Updated dependencies [93bbc20]
- Updated dependencies [f90b8fb]
- Updated dependencies [91783c4]
- Updated dependencies [982885d]
- Updated dependencies [dba7d84]
- Updated dependencies [ca39427]
- Updated dependencies [bd09957]
- Updated dependencies [5a07e67]
- Updated dependencies [2d36552]
- Updated dependencies [45d8288]
- Updated dependencies [490f482]
- Updated dependencies [27308c5]
- Updated dependencies [8689166]
- Updated dependencies [c9327c9]
- Updated dependencies [920165d]
- Updated dependencies [9101be5]
- Updated dependencies [f53a8d0]
- Updated dependencies [968dc1e]
- Updated dependencies [57f9b07]
- Updated dependencies [3c73d99]
- Updated dependencies [d91aed9]
- Updated dependencies [ed71d9e]
- Updated dependencies [7776fc2]
- Updated dependencies [e76634c]
- Updated dependencies [c86185e]
- Updated dependencies [1170ed1]
- Updated dependencies [dd35800]
- Updated dependencies [92814db]
- Updated dependencies [4d73b07]
  - @object-ui/core@17.7.0
  - @object-ui/types@17.7.0
  - @object-ui/components@17.7.0
  - @object-ui/react@17.7.0
  - @object-ui/plugin-kanban@17.7.0
  - @object-ui/plugin-charts@17.7.0

## 17.6.0

### Patch Changes

- 5607092: objectui#4029 — the repo root now lints `no-console` (`error`, allowing
  `warn`/`error`) so a stray module- or function-scope `console.log`/`info`/
  `debug` fails CI instead of shipping silently (as `console.log('Registering
  object-map...')` did in #7139, caught only by hand). Landing the rule meant
  individually judging every real hit outside the tooling exemptions
  (`scripts/**`, `**/examples/**`, test files, `packages/cli/src/**`,
  `packages/create-plugin/src/**`) — this changeset covers the published
  packages whose call sites changed:
  
  - `@object-ui/app-shell`: `ObjectDataPage`'s dropped-URL-filter message is a
    real diagnostic (data silently discarded), so it moves from `console.debug`
    to `console.warn` to match the house convention.
  - `@object-ui/plugin-detail`: `DetailView`'s Web Share API failure now reports
    via `console.error` (it is a real failure, not debug noise); a redundant
    "Link copied to clipboard" success log is removed.
  - `@object-ui/fields`: `MasterDetailField`'s `handleView` stub no longer logs
    the item it does nothing with.
  - `@object-ui/runner`: `App`'s loader-selection debug prints, `LayoutRenderer`'s
    unused click-handler stub log, and `MockDataSource`'s per-call narration
    (`find`/`create`/`getObjectSchema`) are removed — none diagnosed a problem,
    they only echoed the happy path.
  - `object-ui` (VS Code extension): the "extension is now active!" activation
    log is removed.
  
  No behavior changes beyond console output. `@object-ui/core` and
  `@object-ui/data-objectstack` also touch `no-console`-adjacent lines
  (`debugLog`/`debugTime`/`debugTimeEnd`, `createQuietHttpLogger`) but only to
  add `eslint-disable-next-line` documentation — those ARE the repo's
  deliberate debug/logger infrastructure, not leaked residue, so their own
  changeset carries empty frontmatter.
- Updated dependencies [88085e3]
- Updated dependencies [516663d]
- Updated dependencies [feb6b16]
- Updated dependencies [460c4d0]
- Updated dependencies [0ae27f7]
- Updated dependencies [2533ec5]
- Updated dependencies [78c0f9a]
- Updated dependencies [bbe8b86]
- Updated dependencies [e132433]
- Updated dependencies [8477be5]
- Updated dependencies [f95434b]
- Updated dependencies [279fb13]
- Updated dependencies [2e82ab2]
- Updated dependencies [ad07b65]
- Updated dependencies [41f498b]
- Updated dependencies [e1d4251]
- Updated dependencies [40d3a33]
- Updated dependencies [8b9dc62]
- Updated dependencies [1184192]
- Updated dependencies [a2a9747]
- Updated dependencies [a1609a6]
- Updated dependencies [53f23bc]
- Updated dependencies [c4533dc]
- Updated dependencies [be60815]
- Updated dependencies [37f6844]
- Updated dependencies [93de4f6]
- Updated dependencies [2b50261]
- Updated dependencies [384f30d]
- Updated dependencies [ac600e5]
- Updated dependencies [97fba31]
- Updated dependencies [232f61a]
- Updated dependencies [d374caf]
- Updated dependencies [5673576]
- Updated dependencies [c1ef923]
- Updated dependencies [911ceaa]
- Updated dependencies [98eab36]
- Updated dependencies [af5e292]
- Updated dependencies [3fbbea1]
- Updated dependencies [3241559]
- Updated dependencies [7f96b10]
- Updated dependencies [167ec42]
- Updated dependencies [616a2a5]
- Updated dependencies [0046d8f]
- Updated dependencies [f1d4748]
- Updated dependencies [b1119ec]
- Updated dependencies [9f23d2b]
- Updated dependencies [578e025]
- Updated dependencies [af025ee]
- Updated dependencies [598c89a]
- Updated dependencies [4a0bd17]
- Updated dependencies [b8b9af4]
- Updated dependencies [31676be]
- Updated dependencies [8c0d52e]
- Updated dependencies [aff10e2]
- Updated dependencies [70a774b]
- Updated dependencies [9ce096f]
- Updated dependencies [e05db88]
- Updated dependencies [7458a41]
- Updated dependencies [5ffcc14]
- Updated dependencies [d971e51]
- Updated dependencies [97abb24]
- Updated dependencies [deb157a]
- Updated dependencies [d2ce342]
- Updated dependencies [9695da7]
- Updated dependencies [75444e3]
- Updated dependencies [58b8346]
- Updated dependencies [2d0bd16]
- Updated dependencies [d298be8]
- Updated dependencies [dad51e5]
- Updated dependencies [1c9c342]
- Updated dependencies [787c738]
- Updated dependencies [8396656]
- Updated dependencies [dbbd38a]
- Updated dependencies [2165d88]
- Updated dependencies [93fe362]
- Updated dependencies [dfc6975]
- Updated dependencies [3cf4de0]
- Updated dependencies [c9dc811]
- Updated dependencies [144ef9b]
- Updated dependencies [138ab04]
- Updated dependencies [a0b9e91]
- Updated dependencies [99bd015]
  - @object-ui/types@17.6.0
  - @object-ui/react@17.6.0
  - @object-ui/plugin-kanban@17.6.0
  - @object-ui/components@17.6.0
  - @object-ui/core@17.6.0
  - @object-ui/plugin-charts@17.6.0

## 17.5.0

### Patch Changes

- d0c3b26: Every plain `<button>` now declares its `type`. HTML defaults an untyped button to
  `type="submit"`, so any of these buttons would submit the form it was composed into
  instead of running its own handler — a real risk for renderers (`drawer`, `tree-view`,
  `navigation-overlay`) whose placement inside a form is a JSON metadata decision. 114
  sites were converted to `type="button"`; no site was a genuine submit button, and the
  DOM is otherwise unchanged.

  The defect class is now closed mechanically by a new `object-ui/button-has-type` ESLint
  rule (error), so the next untyped button fails CI at write time rather than being found
  by a fourth audit round (objectui#4045, closing the objectui#3344 family).

- Updated dependencies [ceccdcf]
- Updated dependencies [d6e5124]
- Updated dependencies [debad27]
- Updated dependencies [dc2aa3e]
- Updated dependencies [ee66e2e]
- Updated dependencies [ee26e65]
- Updated dependencies [5900ac5]
- Updated dependencies [f650253]
- Updated dependencies [3d9769a]
- Updated dependencies [8f85f8b]
- Updated dependencies [d0c3b26]
- Updated dependencies [3fc2971]
- Updated dependencies [aca27fa]
- Updated dependencies [dde7283]
- Updated dependencies [4dadf0d]
- Updated dependencies [ae10a01]
- Updated dependencies [92876f0]
- Updated dependencies [f279deb]
- Updated dependencies [4b70d28]
- Updated dependencies [eb7f586]
- Updated dependencies [e901131]
- Updated dependencies [d9d3463]
- Updated dependencies [2a40f69]
- Updated dependencies [bec3e14]
- Updated dependencies [613b167]
- Updated dependencies [b4d3c22]
- Updated dependencies [1f9b905]
- Updated dependencies [cb13400]
- Updated dependencies [bc64bfe]
- Updated dependencies [abb0f81]
- Updated dependencies [38ab505]
- Updated dependencies [3e19fe7]
- Updated dependencies [2c8ad7c]
- Updated dependencies [fa21254]
- Updated dependencies [b953a97]
- Updated dependencies [d7f3e30]
- Updated dependencies [7e4f0e5]
- Updated dependencies [a84385b]
- Updated dependencies [45e1949]
- Updated dependencies [0b49d60]
- Updated dependencies [bcd3e02]
- Updated dependencies [92250d6]
- Updated dependencies [c1d939f]
- Updated dependencies [49ae9f4]
- Updated dependencies [a3ae404]
- Updated dependencies [5fac011]
- Updated dependencies [bfdf3d4]
- Updated dependencies [bb68488]
- Updated dependencies [b1e42d0]
- Updated dependencies [2459a3e]
- Updated dependencies [d6aa172]
- Updated dependencies [fe52a04]
- Updated dependencies [3f5f87c]
- Updated dependencies [f5e1143]
- Updated dependencies [f148a64]
- Updated dependencies [bb68488]
- Updated dependencies [9461dd3]
- Updated dependencies [47f551b]
- Updated dependencies [ab04728]
- Updated dependencies [5bf09fd]
  - @object-ui/react@17.5.0
  - @object-ui/components@17.5.0
  - @object-ui/core@17.5.0
  - @object-ui/plugin-charts@17.5.0
  - @object-ui/types@17.5.0
  - @object-ui/plugin-kanban@17.5.0

## 17.4.0

### Patch Changes

- 04fb8b8: Runner in-app navigation now carries the current query string across to the pushed URL instead of `pushState`-ing a bare path. Opening the Runner with `?api=<base>` and clicking a sidebar entry no longer drops the parameter from the address bar, so reloading or sharing the resulting URL still reaches the same backend rather than silently falling back to the (normally empty) `LocalBundleLoader` and rendering `Page not found`. The whole query string is preserved, not just `api` — `@object-ui/core`'s `?__debug…` flags survive navigation for the same reason. A navigation target that spells out its own query keeps it and wins on collision, with the remaining current parameters merged in behind it (#3578).
- 03f25f7: Complete `packages/runner/vite.config.ts`'s workspace alias table to the full
  transitive import closure, so `@object-ui/runner` boots and builds from the
  monorepo sources without a prior `pnpm -w build` (objectui#3575).

  The table aliased 7 `@object-ui/*` specifiers to `packages/*/src`, but those
  `src` trees import 8 more workspace packages that were not aliased. Those fell
  back to Node resolution and landed on `packages/<pkg>/dist`, which does not
  exist in a fresh install-only checkout — so the "From Source" flow documented in
  `content/docs/utilities/runner.mdx` (`pnpm install` then `pnpm dev`, no build
  step) failed with "Failed to run dependency scan" and served HTTP 500 for every
  module on the chain. `pnpm --filter @object-ui/runner build` failed the same way.

  Newly aliased: `i18n`, `sdui-parser`, `react-runtime`, `fields`, `plugin-detail`
  (first layer), `providers` and `permissions` (only reachable once the first layer
  resolves to src), and `data-objectstack` (a type-only import that esbuild erases,
  so the dependency scan never reported it).

  This is user-visible in the published artifact, because the alias table is not
  scoped by `command` and therefore applies to `vite build` as well. Bundling the
  newly aliased packages from src stops the per-icon `lucide-react/dynamic.mjs`
  chunks from being inlined, so the build now emits ~1.7k lazy icon micro-chunks
  like `apps/console` does. `build.modulePreload` is disabled to match console, so
  those chunks are not all preloaded on first paint: the measured initial eager
  payload drops from 4231003 to 591795 bytes, while total `dist` size grows about
  5.5% because the previously inlined icons are now separate files.

- Updated dependencies [794c497]
- Updated dependencies [993336f]
- Updated dependencies [f0a625a]
- Updated dependencies [b5980f4]
- Updated dependencies [8aad9fd]
- Updated dependencies [6719877]
- Updated dependencies [56ff091]
- Updated dependencies [0cbdca8]
- Updated dependencies [d229dfa]
- Updated dependencies [ecae400]
- Updated dependencies [a7e39a8]
- Updated dependencies [4bc6c23]
- Updated dependencies [d3e738a]
- Updated dependencies [c3b01a7]
- Updated dependencies [7ed3360]
- Updated dependencies [0fa5e4d]
- Updated dependencies [5bfaabd]
- Updated dependencies [e06810e]
- Updated dependencies [ab3ad4f]
- Updated dependencies [c2fd122]
- Updated dependencies [e24d767]
- Updated dependencies [aca561a]
- Updated dependencies [48132f7]
- Updated dependencies [0ef9dfd]
- Updated dependencies [1d723e3]
- Updated dependencies [0109f54]
- Updated dependencies [7e5bb5d]
- Updated dependencies [fbc23e0]
- Updated dependencies [e6fdbdc]
- Updated dependencies [54233b1]
- Updated dependencies [97b63d7]
- Updated dependencies [6bb454a]
- Updated dependencies [523be48]
- Updated dependencies [7e2b7e9]
- Updated dependencies [c1e1e6b]
  - @object-ui/components@17.4.0
  - @object-ui/react@17.4.0
  - @object-ui/core@17.4.0
  - @object-ui/types@17.4.0
  - @object-ui/plugin-charts@17.4.0
  - @object-ui/plugin-kanban@17.4.0

## 17.3.0

### Patch Changes

- Updated dependencies [18cd432]
- Updated dependencies [532cf8b]
- Updated dependencies [680080a]
- Updated dependencies [a7651e6]
- Updated dependencies [d915c47]
- Updated dependencies [b71fc92]
- Updated dependencies [34595eb]
- Updated dependencies [3889ffb]
- Updated dependencies [5781fb1]
- Updated dependencies [9e9e9a9]
- Updated dependencies [56409c2]
- Updated dependencies [042e09d]
- Updated dependencies [9cbcbf4]
- Updated dependencies [85c4c9c]
- Updated dependencies [fd54c3e]
- Updated dependencies [4eeb932]
- Updated dependencies [23018cc]
- Updated dependencies [53811d1]
- Updated dependencies [d915c47]
- Updated dependencies [f44d872]
- Updated dependencies [524a635]
- Updated dependencies [509104a]
- Updated dependencies [825bbe3]
- Updated dependencies [aa36e60]
- Updated dependencies [5dd0127]
- Updated dependencies [06632e9]
- Updated dependencies [a4cff5b]
- Updated dependencies [175bd79]
- Updated dependencies [f833d3a]
- Updated dependencies [2a9513d]
- Updated dependencies [71be406]
- Updated dependencies [d22ae31]
- Updated dependencies [8d8094a]
  - @object-ui/core@17.3.0
  - @object-ui/components@17.3.0
  - @object-ui/types@17.3.0
  - @object-ui/plugin-charts@17.3.0
  - @object-ui/react@17.3.0
  - @object-ui/plugin-kanban@17.3.0

## 17.2.0

### Minor Changes

- 4a51e77: Stop declaring 14 symbols across ten packages under names `@objectstack/spec`
  owns (objectui#3161, objectstack#4115 batch 7 — the long tail, one or two
  entries per package). All ten packages leave the ledger, which drops from 17
  collisions across 11 packages to 3 across 1.

  **Renamed exports** — in every case the spec exports the same name for a
  _different_ thing, so the old name was a mis-description rather than a dialect:

  | package                    | was                                | now                                                  | what the spec's same-named export is                                                                                                       |
  | :------------------------- | :--------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
  | `@object-ui/fields`        | `FieldWidgetProps`                 | `FieldWidgetComponentProps`                          | the DECLARED field-widget plugin props contract (a zod object; `field.type` is the `FieldType` enum, `readonly`/`required` carry defaults) |
  | `@object-ui/layout`        | `PageHeaderProps`                  | `PageHeaderComponentProps`                           | the authored `page:header` node — a zod schema of `title`, `subtitle`, an icon NAME, `breadcrumb`, `actions: string[]`                     |
  | `@object-ui/layout`        | `Page`                             | `PageNodeRenderer`                                   | the authored page metadata DOCUMENT (`name`, `label`, `type`, `regions`)                                                                   |
  | `@object-ui/plugin-detail` | `ObjectFieldLike`                  | `ObjectDefFieldLike`                                 | the i18n duck type `translateObject` walks (`help`/`description`, plus `[key: string]: any`)                                               |
  | `@object-ui/plugin-grid`   | `ColumnSummaryConfig`              | `ColumnSummarySetting`                               | the OBJECT form of `ListColumn.summary` **only** — the local one was the whole union, shorthand included                                   |
  | `@object-ui/plugin-grid`   | `isMultiValueField`                | `hasMultiValueShape`                                 | the spec's classifier, which requires a def with a `type`; the local one is called with `undefined`                                        |
  | `@object-ui/collaboration` | `RealtimeConfig`                   | `RealtimeSubscriptionConfig`                         | the app's realtime DECLARATION (`enabled`, `transport`, `subscriptions[]`)                                                                 |
  | `@object-ui/plugin-charts` | `ChartConfig`                      | `ChartContainerConfig`                               | the authored chart document (`type`, `xAxis`, `series`, `showLegend`, …)                                                                   |
  | `@object-ui/plugin-form`   | `FormSection` / `FormSectionProps` | `FormSectionContainer` / `FormSectionContainerProps` | the authored form-section metadata (`name`, `pane`, `visibleWhen`, `fields`)                                                               |
  | `@object-ui/providers`     | `Theme`                            | `ThemePreference`                                    | a whole theme DOCUMENT (`name`, `label`, `colors`, `typography`)                                                                           |
  | `@object-ui/runner`        | `App` (default export)             | `RunnerApp`                                          | the authored application metadata type **and** the `App.create()` builder                                                                  |
  | `@object-ui/sdui-parser`   | `ValidationResult`                 | `ManifestValidationResult`                           | plugin-manifest validation (`{ valid, errors?, warnings? }`), exported from both `kernel` and `contracts`                                  |

  `ManifestValidationResult` follows the `<what was validated>Validation<Error|Result>`
  convention registered on objectstack#4115 (`@object-ui/core` took
  `SchemaNodeValidationResult` in batch 4). `PageHeaderComponentProps` deliberately
  reuses the name `@object-ui/app-shell` already chose for its own header props in
  batch 3, so one concept does not acquire two dialect names one package apart.

  **Now derived from the spec instead of hand-written:**

  - `@object-ui/fields` — `isFileIdToken` is re-exported from
    `@objectstack/spec/data`. The local copy was character-for-character identical
    to the spec's function while its comment said it "mirrors" it, so every
    behaviour test passed and only reference identity could tell the two apart.
    The regex is a wire decision: widening it server-side while a copy here kept
    the old bound would make every new id read as "not a reference", and the
    widget would submit the legacy inline blob to a backend expecting a reference.
  - `@object-ui/plugin-detail` — `FeedFilterMode` is re-exported from
    `@objectstack/spec/data`, in a file that already imported the sibling
    `FeedItemType` from the spec.
  - `@object-ui/plugin-grid` — the eleven-member aggregation union is now the
    spec's `ColumnSummary` enum, so the total `Record<ColumnSummaryType, string>`
    label map turns a member the spec adds into a compile error instead of a
    blank footer cell. `ColumnSummarySetting` is `NonNullable<ListColumn['summary']>`,
    i.e. whatever forms the spec itself accepts. `hasMultiValueShape` delegates to
    the spec's `isMultiValueField` rather than re-deriving it from
    `MULTI_OPTION_TYPES` / `MULTI_CAPABLE_TYPES`.
  - `@object-ui/providers` — `ThemePreference` is the spec's `ThemeMode` union
    plus the one legacy `'system'` spelling this provider still honours for stored
    preferences, read off the schema's own `_zod` carrier so the package takes no
    zod dependency.

  `@objectstack/spec` moves from `devDependencies` to `dependencies` in
  `@object-ui/fields` (it re-exports a runtime function) and `@object-ui/providers`
  (its public `.d.ts` now references the spec).

  Scored `minor`, not `major`, per this repo's fixed-group rule — objectui's major
  tracks `@objectstack`, so breaking changes of our own ship as minor with the
  semantics spelled out above (see AGENTS.md §版本号策略). A `major` here would carry
  all 39 packages of the fixed group to `18.0.0` and off objectstack's 17.x line.

### Patch Changes

- Updated dependencies [4ae0ac4]
- Updated dependencies [696e3c1]
- Updated dependencies [bca45cc]
- Updated dependencies [a889e31]
- Updated dependencies [09d30a4]
- Updated dependencies [4bf612c]
- Updated dependencies [335041c]
- Updated dependencies [b414983]
- Updated dependencies [256f8cc]
- Updated dependencies [d9668a7]
- Updated dependencies [cb82705]
- Updated dependencies [f572849]
- Updated dependencies [4a51e77]
- Updated dependencies [f6e8d78]
- Updated dependencies [ea96284]
- Updated dependencies [d3584c6]
- Updated dependencies [a8ad6c0]
- Updated dependencies [444457c]
- Updated dependencies [850033c]
- Updated dependencies [022e4c3]
- Updated dependencies [009e25d]
- Updated dependencies [726b89c]
  - @object-ui/types@17.2.0
  - @object-ui/components@17.2.0
  - @object-ui/core@17.2.0
  - @object-ui/react@17.2.0
  - @object-ui/plugin-charts@17.2.0
  - @object-ui/plugin-kanban@17.2.0

## 17.1.0

### Patch Changes

- Updated dependencies [62311b6]
- Updated dependencies [fc0272a]
- Updated dependencies [9e7349e]
- Updated dependencies [8864971]
- Updated dependencies [c785740]
- Updated dependencies [b41f401]
- Updated dependencies [19e9fa0]
- Updated dependencies [95b7214]
- Updated dependencies [7d9734d]
- Updated dependencies [6ae818e]
- Updated dependencies [f1c04b6]
- Updated dependencies [9eb932b]
- Updated dependencies [746dd00]
- Updated dependencies [aebfa4f]
- Updated dependencies [38ca8be]
- Updated dependencies [68ef584]
- Updated dependencies [4952edf]
- Updated dependencies [7f0252e]
- Updated dependencies [c4d7b20]
- Updated dependencies [c769d3d]
- Updated dependencies [7639a61]
- Updated dependencies [94e63ef]
- Updated dependencies [c735bf7]
- Updated dependencies [02aef0c]
- Updated dependencies [6f29aa5]
- Updated dependencies [c4db402]
- Updated dependencies [5319bf1]
- Updated dependencies [49e5671]
- Updated dependencies [9a04d25]
- Updated dependencies [b5b97e2]
- Updated dependencies [f59f2c1]
- Updated dependencies [07de839]
- Updated dependencies [2a40b5e]
- Updated dependencies [df613fa]
- Updated dependencies [4874117]
- Updated dependencies [ad0183a]
- Updated dependencies [ce08d55]
- Updated dependencies [eb4b740]
- Updated dependencies [5b084eb]
- Updated dependencies [aa1240a]
- Updated dependencies [2374a49]
- Updated dependencies [390c071]
- Updated dependencies [d10f526]
- Updated dependencies [2d5d594]
- Updated dependencies [ea7f477]
- Updated dependencies [379728f]
- Updated dependencies [7f23cd0]
- Updated dependencies [0ded602]
- Updated dependencies [24e0e0a]
- Updated dependencies [3a6cf24]
- Updated dependencies [aa35561]
- Updated dependencies [03bd53b]
- Updated dependencies [3c1f321]
- Updated dependencies [a045a32]
- Updated dependencies [912496d]
- Updated dependencies [80edbd4]
- Updated dependencies [9867281]
  - @object-ui/core@17.1.0
  - @object-ui/components@17.1.0
  - @object-ui/react@17.1.0
  - @object-ui/types@17.1.0
  - @object-ui/plugin-charts@17.1.0
  - @object-ui/plugin-kanban@17.1.0

## 17.0.0

### Patch Changes

- b076050: fix(console,runner): the approvals inbox renders against one ticking clock, and both packages now run ESLint

  `apps/console` and `packages/runner` had no `lint` script, so `turbo run lint`
  skipped them silently and their 17 ESLint **errors** had never been seen
  (#2923 declared them as DEBT; this closes the gap). Both now carry
  `"lint": "eslint ."` and the `DEBT` list in `scripts/check-lint-coverage.mjs`
  is empty — every workspace package is linted.

  What the errors actually were, once read one by one:

  - **8x `react-hooks/purity` — real, and user-visible.** The approvals inbox
    read `Date.now()` mid-render for every age tint, "5m ago" label and SLA chip.
    Render must be pure: the output depended on when React happened to render, so
    it disagreed with itself under StrictMode's double render and then **froze** —
    an inbox left open kept saying "just now" and an SLA countdown never counted
    down. The page now renders against a single `now` held in state and advanced
    once a minute (the finest granularity anything here displays), so render is a
    pure function of props+state _and_ the figures actually tick.
  - Alongside that, `sla_due_at` is now parsed through a guard. A due date the
    backend sends in a shape `Date.parse` can't read used to render as
    "SLA NaNh left"; it now renders nothing.
  - **1x `react-hooks/static-components` — real.** `StatusBadge` was declared
    inside `ApprovalsInboxPage`, making it a brand-new component type on every
    render, so React unmounted and remounted every status chip in the table each
    time the page re-rendered. Hoisted to module scope, with the translated label
    passed as a prop.
  - **6x `react-hooks/static-components` — false positives** (3 in the console's
    settings pages, 3 in the runner's `LayoutRenderer`). All six render the result
    of `getIcon`/`getLazyIcon`, which memoises per name in a module-level cache —
    the component reference is stable across renders and nothing is created during
    render. The rule cannot see through the call, so these carry the same targeted
    `eslint-disable-next-line` + justification the repo already uses at a dozen
    icon-registry sites, and the resolvers themselves now say so in a comment.
    (Verified rather than assumed: typing into a settings field keeps focus and
    every character, so no state was ever being reset there.)
  - **2 minor.** A dead `token` initializer on the console's auth preflight path
    (`no-useless-assignment` — read, not blind-deleted: no intended write was
    missing, every path out of the try/catch either assigns or returns), and a
    `prefer-const` in the SDUI workbench preview.

- b39f4b3: fix(runner): type-check the package at all, and fix the `DataSource` contract violation that hid behind a broken import (#2917)

  `@object-ui/runner` was the worst-covered package in the repo: `build` is
  `vite build` (transpile only), it had no `type-check` script, and — uniquely —
  **no `tsconfig.json` at all**. Nothing had ever type-checked it, despite it being
  a published package.

  **It was not broken at runtime.** The two bad imports were `import type`, so they
  were erased before they could fail, and the one value import
  (`emulateBatchTransaction`) does exist. `MockDataSource` is also unreferenced
  anywhere in the repo. So this is a correctness and reference-quality fix, not an
  outage.

  **What the missing check actually hid.** `DataSource` and
  `BatchTransactionOperation` were imported from `@object-ui/core`, which does not
  export them — they live in `@object-ui/types`. Because that import never
  resolved, `class MockDataSource implements DataSource` was silently a no-op, and
  three separate commits maintained the class _as if_ it were being verified
  (`62b9ab510` added `batchTransaction`, `09d9669c7` made `getObjectSchema`
  required, `5527388b0` added input validation). With the `implements` clause
  inert, a real contract violation survived all three:

  ```ts
  async find(resource: string, params?: any): Promise<any[]> { return []; }
  ```

  `DataSource.find` returns a `QueryResult` envelope, not a bare array. Anyone
  copying this mock as the starting point for their own adapter — which is exactly
  what its doc comment invites — would hand every consumer an array where `.data`
  and `.total` are `undefined`. Now typed as `Promise<QueryResult>` and returning
  `{ data: [], total: 0 }`.

  Also in this change:

  - `packages/runner/tsconfig.json` added, mirroring `apps/console` rather than the
    library packages: `runner` is a Vite app, so it wants `bundler` resolution,
    `allowImportingTsExtensions` (for `./App.tsx`) and `types: ["vite/client"]`
    (for `import.meta.glob` in `MetadataLoader` and the `./index.css` side-effect
    import). Keeping it standalone instead of extending the root config also means
    it never inherits the root `paths`, so workspace deps resolve through built
    `.d.ts` and the TS6059 `rootDir` class of error cannot appear.
  - unused parameters prefixed with `_` (6x in `mockDataSource`), and an unused
    `Circle` icon import dropped from `LayoutRenderer`.
  - `"type-check": "tsc --noEmit"` added, and the package's `DEBT` entry deleted
    from `scripts/check-type-check-coverage.mjs`. Coverage goes 35 -> 36 of 45 and
    outstanding errors 46 -> 32.

  Verified the gate genuinely covers the package now, rather than trusting the
  green: injecting a type error into `runner/src/App.tsx` makes `pnpm type-check`
  fail with `Failed: @object-ui/runner#type-check`, which was impossible before
  this change.

- Updated dependencies [7b21891]
- Updated dependencies [952b978]
- Updated dependencies [de5e40c]
- Updated dependencies [aa88056]
- Updated dependencies [1767124]
- Updated dependencies [8ecf5a6]
- Updated dependencies [7b35e4b]
- Updated dependencies [8fb1295]
- Updated dependencies [e16ed2d]
- Updated dependencies [f9bbddb]
- Updated dependencies [dfd3705]
- Updated dependencies [c77108c]
- Updated dependencies [2735de6]
- Updated dependencies [c19ac11]
- Updated dependencies [6dee2cb]
- Updated dependencies [c7cff19]
- Updated dependencies [ba73a02]
- Updated dependencies [cd09a7b]
- Updated dependencies [f1abf0e]
- Updated dependencies [f05b84e]
- Updated dependencies [2f947e4]
- Updated dependencies [7d46648]
- Updated dependencies [6e8fd3c]
- Updated dependencies [9b53d72]
- Updated dependencies [662bdf9]
- Updated dependencies [059a052]
- Updated dependencies [53642d4]
- Updated dependencies [8aae006]
- Updated dependencies [c6cfdf1]
- Updated dependencies [d147a13]
- Updated dependencies [c6aaed8]
- Updated dependencies [dc334da]
  - @object-ui/components@17.0.0
  - @object-ui/react@17.0.0
  - @object-ui/plugin-charts@17.0.0
  - @object-ui/types@17.0.0
  - @object-ui/core@17.0.0
  - @object-ui/plugin-kanban@17.0.0

## 16.1.0

### Minor Changes

- 62b9ab5: feat(data): unify master-detail saves behind `DataSource.batchTransaction`, isolate the non-atomic fallback in the adapter (#2679)

  Master-detail saves (`MasterDetailForm`, `LineItemsPanel`) now always persist
  through `dataSource.batchTransaction(operations)` — one ordered cross-object
  operation list, with `{ $ref: <op index> }` linking a child to a parent created
  in the same batch. The form no longer contains any client-side orchestration or
  best-effort compensation-delete; that atomicity anti-pattern is gone from the UI
  layer (framework #1604 / framework ADR-0034 item 4).

  - **`@object-ui/types`** — `batchTransaction?` is now a first-class (optional)
    method on the `DataSource` contract, typed via `BatchTransactionOperation` /
    `BatchRef`. Replaces the previous `(dataSource as any).batchTransaction`
    method-sniffing.
  - **`@object-ui/core`** — new `emulateBatchTransaction(dataSource, operations)`
    (sequential writes, `$ref` resolution, best-effort reverse-order compensation)
    and `runBatchTransaction(dataSource, operations)` (prefers the adapter's method,
    emulates otherwise). `ApiDataSource` / `ValueDataSource` implement
    `batchTransaction` via the emulation.
  - **`@object-ui/data-objectstack`** — `ObjectStackAdapter.batchTransaction` uses
    the server's atomic `POST /api/v1/batch`, prefers the typed
    `client.data.batchTransaction` SDK method when the installed client exposes it,
    and degrades to the client-side emulation ONLY when the endpoint is missing
    (404/405) or the runtime can't do transactions (501). Real errors (400/401/403/
    409/500) still surface. This is the isolated, tested home of the non-atomic
    fallback.
  - **`@object-ui/plugin-form`** — removed `applyDetail` / `createMany` /
    `ApplyDetailResult` from `masterDetailTx.ts`; `MasterDetailForm` and
    `LineItemsPanel` build ops and call `runBatchTransaction`. `LineItemsPanel`
    saves are now atomic on a capable backend, with the rollup folded into the same
    batch.

  No behavior change on a current ObjectStack backend (it has `/api/v1/batch`);
  older/limited backends keep a working — now clearly non-atomic — save path.

### Patch Changes

- Updated dependencies [1c8935a]
- Updated dependencies [8b8b744]
- Updated dependencies [7cf4051]
- Updated dependencies [803558e]
- Updated dependencies [2e7d7f0]
- Updated dependencies [ef14f69]
- Updated dependencies [94d4876]
- Updated dependencies [69fa5d1]
- Updated dependencies [549c67d]
- Updated dependencies [ebe6494]
- Updated dependencies [2b17339]
- Updated dependencies [31b77d4]
- Updated dependencies [6d4fbe6]
- Updated dependencies [0a3710b]
- Updated dependencies [62b9ab5]
- Updated dependencies [1629313]
- Updated dependencies [29c6040]
- Updated dependencies [faebac3]
- Updated dependencies [2331ac9]
- Updated dependencies [199fa83]
- Updated dependencies [eee4ded]
  - @object-ui/core@16.1.0
  - @object-ui/types@16.1.0
  - @object-ui/react@16.1.0
  - @object-ui/components@16.1.0
  - @object-ui/plugin-kanban@16.1.0
  - @object-ui/plugin-charts@16.1.0

## 16.0.0

### Patch Changes

- Updated dependencies [d3e19ed]
- Updated dependencies [59d4fa9]
- Updated dependencies [4c7c47f]
- Updated dependencies [210806a]
- Updated dependencies [b4ef588]
- Updated dependencies [5534535]
- Updated dependencies [9b8f978]
- Updated dependencies [195a651]
- Updated dependencies [33b4995]
  - @object-ui/react@16.0.0
  - @object-ui/components@16.0.0
  - @object-ui/types@16.0.0
  - @object-ui/plugin-charts@16.0.0
  - @object-ui/plugin-kanban@16.0.0
  - @object-ui/core@16.0.0

## 15.0.0

### Patch Changes

- @object-ui/plugin-kanban@15.0.0
- @object-ui/types@15.0.0
- @object-ui/core@15.0.0
- @object-ui/react@15.0.0
- @object-ui/components@15.0.0
- @object-ui/plugin-charts@15.0.0

## 14.1.0

### Patch Changes

- Updated dependencies [0890fa7]
- Updated dependencies [2ded18c]
- Updated dependencies [e628d1f]
- Updated dependencies [5523fc4]
- Updated dependencies [887062c]
- Updated dependencies [055e1d2]
- Updated dependencies [d741937]
- Updated dependencies [9e2d58f]
- Updated dependencies [dea65f7]
- Updated dependencies [f30ff68]
- Updated dependencies [073e7aa]
- Updated dependencies [6c0135c]
- Updated dependencies [5b52624]
- Updated dependencies [4afb251]
- Updated dependencies [d5b1bc0]
- Updated dependencies [f94905d]
- Updated dependencies [f0f10f5]
  - @object-ui/core@14.1.0
  - @object-ui/types@14.1.0
  - @object-ui/react@14.1.0
  - @object-ui/components@14.1.0
  - @object-ui/plugin-kanban@14.1.0
  - @object-ui/plugin-charts@14.1.0

## 14.0.0

### Patch Changes

- Updated dependencies [443360a]
- Updated dependencies [86c69c3]
- Updated dependencies [05e56ca]
- Updated dependencies [a44e7b6]
- Updated dependencies [6a74160]
  - @object-ui/core@14.0.0
  - @object-ui/react@14.0.0
  - @object-ui/types@14.0.0
  - @object-ui/components@14.0.0
  - @object-ui/plugin-charts@14.0.0
  - @object-ui/plugin-kanban@14.0.0

## 13.2.0

### Patch Changes

- Updated dependencies [80901aa]
- Updated dependencies [e492b9d]
  - @object-ui/components@13.2.0
  - @object-ui/plugin-charts@13.2.0
  - @object-ui/plugin-kanban@13.2.0
  - @object-ui/react@13.2.0
  - @object-ui/types@13.2.0
  - @object-ui/core@13.2.0

## 13.1.0

### Patch Changes

- @object-ui/types@13.1.0
- @object-ui/core@13.1.0
- @object-ui/react@13.1.0
- @object-ui/components@13.1.0
- @object-ui/plugin-charts@13.1.0
- @object-ui/plugin-kanban@13.1.0

## 13.0.0

### Patch Changes

- Updated dependencies [ac04b76]
- Updated dependencies [619097e]
  - @object-ui/components@13.0.0
  - @object-ui/types@13.0.0
  - @object-ui/plugin-charts@13.0.0
  - @object-ui/plugin-kanban@13.0.0
  - @object-ui/react@13.0.0
  - @object-ui/core@13.0.0

## 12.1.0

### Patch Changes

- Updated dependencies [6cbccf3]
- Updated dependencies [c31874d]
  - @object-ui/components@12.1.0
  - @object-ui/types@12.1.0
  - @object-ui/plugin-kanban@12.1.0
  - @object-ui/plugin-charts@12.1.0
  - @object-ui/react@12.1.0
  - @object-ui/core@12.1.0

## 12.0.0

### Patch Changes

- Updated dependencies [226fde9]
- Updated dependencies [e4de456]
  - @object-ui/types@12.0.0
  - @object-ui/core@12.0.0
  - @object-ui/components@12.0.0
  - @object-ui/plugin-charts@12.0.0
  - @object-ui/plugin-kanban@12.0.0
  - @object-ui/react@12.0.0

## 11.5.0

### Patch Changes

- Updated dependencies [6fffd3d]
- Updated dependencies [9255686]
- Updated dependencies [fae75e2]
- Updated dependencies [1072701]
  - @object-ui/react@11.5.0
  - @object-ui/components@11.5.0
  - @object-ui/types@11.5.0
  - @object-ui/plugin-charts@11.5.0
  - @object-ui/plugin-kanban@11.5.0
  - @object-ui/core@11.5.0

## 11.4.0

### Patch Changes

- Updated dependencies [8bf6295]
- Updated dependencies [1948c5b]
- Updated dependencies [bce581a]
- Updated dependencies [c38d107]
- Updated dependencies [7782698]
- Updated dependencies [e84d64d]
  - @object-ui/types@11.4.0
  - @object-ui/components@11.4.0
  - @object-ui/core@11.4.0
  - @object-ui/plugin-charts@11.4.0
  - @object-ui/plugin-kanban@11.4.0
  - @object-ui/react@11.4.0

## 11.3.0

### Patch Changes

- Updated dependencies [d88c8ec]
- Updated dependencies [b7237bb]
- Updated dependencies [d23d6eb]
  - @object-ui/components@11.3.0
  - @object-ui/core@11.3.0
  - @object-ui/plugin-charts@11.3.0
  - @object-ui/plugin-kanban@11.3.0
  - @object-ui/react@11.3.0
  - @object-ui/types@11.3.0

## 11.2.0

### Patch Changes

- Updated dependencies [9e7a986]
- Updated dependencies [1311749]
  - @object-ui/components@11.2.0
  - @object-ui/core@11.2.0
  - @object-ui/plugin-kanban@11.2.0
  - @object-ui/plugin-charts@11.2.0
  - @object-ui/react@11.2.0
  - @object-ui/types@11.2.0

## 11.1.0

### Patch Changes

- @object-ui/components@11.1.0
- @object-ui/plugin-charts@11.1.0
- @object-ui/plugin-kanban@11.1.0
- @object-ui/react@11.1.0
- @object-ui/types@11.1.0
- @object-ui/core@11.1.0

## 7.3.0

### Patch Changes

- @object-ui/plugin-kanban@7.3.0
- @object-ui/types@7.3.0
- @object-ui/core@7.3.0
- @object-ui/react@7.3.0
- @object-ui/components@7.3.0
- @object-ui/plugin-charts@7.3.0

## 7.2.0

### Patch Changes

- Updated dependencies [d23db5c]
  - @object-ui/types@7.2.0
  - @object-ui/components@7.2.0
  - @object-ui/plugin-charts@7.2.0
  - @object-ui/plugin-kanban@7.2.0
  - @object-ui/react@7.2.0
  - @object-ui/core@7.2.0

## 7.1.0

### Patch Changes

- Updated dependencies [677f7ed]
- Updated dependencies [08c47da]
- Updated dependencies [a71be60]
- Updated dependencies [cb03bc3]
- Updated dependencies [93cf2b1]
  - @object-ui/plugin-charts@7.1.0
  - @object-ui/types@7.1.0
  - @object-ui/core@7.1.0
  - @object-ui/react@7.1.0
  - @object-ui/components@7.1.0
  - @object-ui/plugin-kanban@7.1.0

## 7.0.0

### Patch Changes

- Updated dependencies [5976ba3]
- Updated dependencies [a00e16d]
- Updated dependencies [eaccefd]
- Updated dependencies [f7f325d]
- Updated dependencies [c12986e]
- Updated dependencies [71d7ce0]
- Updated dependencies [053c948]
- Updated dependencies [ddbe4a2]
- Updated dependencies [2d47e94]
- Updated dependencies [c5a7d6f]
- Updated dependencies [9049bbe]
- Updated dependencies [6c0c92c]
- Updated dependencies [cb2fdb1]
- Updated dependencies [c3749eb]
- Updated dependencies [6cfa330]
- Updated dependencies [ad8ade6]
- Updated dependencies [e270c7d]
- Updated dependencies [ab168e4]
- Updated dependencies [d54346c]
- Updated dependencies [3870c20]
- Updated dependencies [2eb3096]
- Updated dependencies [b88c560]
- Updated dependencies [d16566f]
- Updated dependencies [90acb7f]
- Updated dependencies [7913390]
- Updated dependencies [1394e34]
- Updated dependencies [e95cc25]
- Updated dependencies [abe8ebc]
- Updated dependencies [300d755]
- Updated dependencies [bd8b054]
- Updated dependencies [4eb9cb6]
- Updated dependencies [7c239fd]
- Updated dependencies [858ad94]
- Updated dependencies [2270239]
- Updated dependencies [8d1195d]
  - @object-ui/core@7.0.0
  - @object-ui/components@7.0.0
  - @object-ui/react@7.0.0
  - @object-ui/types@7.0.0
  - @object-ui/plugin-charts@7.0.0
  - @object-ui/plugin-kanban@7.0.0

## 6.2.3

### Patch Changes

- @object-ui/types@6.2.3
- @object-ui/core@6.2.3
- @object-ui/react@6.2.3
- @object-ui/components@6.2.3
- @object-ui/plugin-charts@6.2.3
- @object-ui/plugin-kanban@6.2.3

## 6.2.2

### Patch Changes

- Updated dependencies [a66f788]
  - @object-ui/react@6.2.2
  - @object-ui/components@6.2.2
  - @object-ui/plugin-charts@6.2.2
  - @object-ui/plugin-kanban@6.2.2
  - @object-ui/types@6.2.2
  - @object-ui/core@6.2.2

## 6.2.1

### Patch Changes

- @object-ui/types@6.2.1
- @object-ui/core@6.2.1
- @object-ui/react@6.2.1
- @object-ui/components@6.2.1
- @object-ui/plugin-charts@6.2.1
- @object-ui/plugin-kanban@6.2.1

## 6.2.0

### Patch Changes

- @object-ui/plugin-kanban@6.2.0
- @object-ui/react@6.2.0
- @object-ui/components@6.2.0
- @object-ui/plugin-charts@6.2.0
- @object-ui/types@6.2.0
- @object-ui/core@6.2.0

## 6.1.0

### Patch Changes

- Updated dependencies [991b62d]
  - @object-ui/core@6.1.0
  - @object-ui/plugin-charts@6.1.0
  - @object-ui/types@6.1.0
  - @object-ui/components@6.1.0
  - @object-ui/plugin-kanban@6.1.0
  - @object-ui/react@6.1.0

## 6.0.4

### Patch Changes

- @object-ui/types@6.0.4
- @object-ui/core@6.0.4
- @object-ui/react@6.0.4
- @object-ui/components@6.0.4
- @object-ui/plugin-charts@6.0.4
- @object-ui/plugin-kanban@6.0.4

## 6.0.3

### Patch Changes

- @object-ui/types@6.0.3
- @object-ui/core@6.0.3
- @object-ui/react@6.0.3
- @object-ui/components@6.0.3
- @object-ui/plugin-charts@6.0.3
- @object-ui/plugin-kanban@6.0.3

## 6.0.2

### Patch Changes

- @object-ui/types@6.0.2
- @object-ui/core@6.0.2
- @object-ui/react@6.0.2
- @object-ui/components@6.0.2
- @object-ui/plugin-charts@6.0.2
- @object-ui/plugin-kanban@6.0.2

## 6.0.1

### Patch Changes

- @object-ui/types@6.0.1
- @object-ui/core@6.0.1
- @object-ui/react@6.0.1
- @object-ui/components@6.0.1
- @object-ui/plugin-charts@6.0.1
- @object-ui/plugin-kanban@6.0.1

## 6.0.0

### Patch Changes

- @object-ui/types@6.0.0
- @object-ui/core@6.0.0
- @object-ui/react@6.0.0
- @object-ui/components@6.0.0
- @object-ui/plugin-charts@6.0.0
- @object-ui/plugin-kanban@6.0.0

## 5.4.2

### Patch Changes

- @object-ui/types@5.4.2
- @object-ui/core@5.4.2
- @object-ui/react@5.4.2
- @object-ui/components@5.4.2
- @object-ui/plugin-charts@5.4.2
- @object-ui/plugin-kanban@5.4.2

## 5.4.1

### Patch Changes

- @object-ui/types@5.4.1
- @object-ui/core@5.4.1
- @object-ui/react@5.4.1
- @object-ui/components@5.4.1
- @object-ui/plugin-charts@5.4.1
- @object-ui/plugin-kanban@5.4.1

## 5.4.0

### Patch Changes

- Updated dependencies [3a8c754]
  - @object-ui/types@5.4.0
  - @object-ui/components@5.4.0
  - @object-ui/core@5.4.0
  - @object-ui/plugin-charts@5.4.0
  - @object-ui/plugin-kanban@5.4.0
  - @object-ui/react@5.4.0

## 5.3.2

### Patch Changes

- @object-ui/types@5.3.2
- @object-ui/core@5.3.2
- @object-ui/react@5.3.2
- @object-ui/components@5.3.2
- @object-ui/plugin-charts@5.3.2
- @object-ui/plugin-kanban@5.3.2

## 5.3.1

### Patch Changes

- @object-ui/types@5.3.1
- @object-ui/core@5.3.1
- @object-ui/react@5.3.1
- @object-ui/components@5.3.1
- @object-ui/plugin-charts@5.3.1
- @object-ui/plugin-kanban@5.3.1

## 5.3.0

### Patch Changes

- @object-ui/types@5.3.0
- @object-ui/core@5.3.0
- @object-ui/react@5.3.0
- @object-ui/components@5.3.0
- @object-ui/plugin-charts@5.3.0
- @object-ui/plugin-kanban@5.3.0

## 5.2.1

### Patch Changes

- @object-ui/types@5.2.1
- @object-ui/core@5.2.1
- @object-ui/react@5.2.1
- @object-ui/components@5.2.1
- @object-ui/plugin-charts@5.2.1
- @object-ui/plugin-kanban@5.2.1

## 5.2.0

### Patch Changes

- Updated dependencies [de0c5e6]
- Updated dependencies [9997cae]
- Updated dependencies [b2d1704]
- Updated dependencies [a3cb88f]
- Updated dependencies [5425608]
- Updated dependencies [d912a60]
- Updated dependencies [87bc8ff]
- Updated dependencies [3ebba63]
- Updated dependencies [77a6118]
- Updated dependencies [a8d12ec]
- Updated dependencies [70b5570]
- Updated dependencies [aa063db]
- Updated dependencies [d1442e3]
- Updated dependencies [7c7400a]
  - @object-ui/types@5.2.0
  - @object-ui/core@5.2.0
  - @object-ui/react@5.2.0
  - @object-ui/plugin-kanban@5.2.0
  - @object-ui/components@5.2.0
  - @object-ui/plugin-charts@5.2.0

## 5.1.1

### Patch Changes

- Updated dependencies [8955b9c]
  - @object-ui/components@5.1.1
  - @object-ui/plugin-charts@5.1.1
  - @object-ui/plugin-kanban@5.1.1
  - @object-ui/types@5.1.1
  - @object-ui/core@5.1.1
  - @object-ui/react@5.1.1

## 5.1.0

### Patch Changes

- Updated dependencies [bd8447d]
- Updated dependencies [fbd5052]
- Updated dependencies [d51a577]
- Updated dependencies [d1ec6a2]
- Updated dependencies [cf30cc2]
- Updated dependencies [5b80cfd]
- Updated dependencies [d548d6b]
  - @object-ui/components@5.1.0
  - @object-ui/react@5.1.0
  - @object-ui/types@5.1.0
  - @object-ui/core@5.1.0
  - @object-ui/plugin-charts@5.1.0
  - @object-ui/plugin-kanban@5.1.0

## 5.0.2

### Patch Changes

- @object-ui/components@5.0.2
- @object-ui/plugin-charts@5.0.2
- @object-ui/plugin-kanban@5.0.2
- @object-ui/react@5.0.2
- @object-ui/types@5.0.2
- @object-ui/core@5.0.2

## 5.0.1

### Patch Changes

- @object-ui/types@5.0.1
- @object-ui/core@5.0.1
- @object-ui/react@5.0.1
- @object-ui/components@5.0.1
- @object-ui/plugin-charts@5.0.1
- @object-ui/plugin-kanban@5.0.1

## 5.0.0

### Patch Changes

- Updated dependencies [8930b15]
- Updated dependencies [95b6b21]
- Updated dependencies [ddb08a7]
- Updated dependencies [765d50f]
- Updated dependencies [927187a]
- Updated dependencies [bae8ba8]
- Updated dependencies [8435860]
- Updated dependencies [bb2ea48]
- Updated dependencies [b14fe09]
- Updated dependencies [a7bef6e]
- Updated dependencies [74962b0]
- Updated dependencies [3154334]
- Updated dependencies [fa4c2cb]
- Updated dependencies [7213027]
  - @object-ui/components@5.0.0
  - @object-ui/react@5.0.0
  - @object-ui/types@5.0.0
  - @object-ui/plugin-kanban@5.0.0
  - @object-ui/plugin-charts@5.0.0
  - @object-ui/core@5.0.0

## 4.8.0

### Patch Changes

- Updated dependencies [3a17c8d]
  - @object-ui/plugin-kanban@4.8.0
  - @object-ui/types@4.8.0
  - @object-ui/core@4.8.0
  - @object-ui/react@4.8.0
  - @object-ui/components@4.8.0
  - @object-ui/plugin-charts@4.8.0

## 4.7.0

### Patch Changes

- Updated dependencies [186fb2b]
  - @object-ui/plugin-kanban@4.7.0
  - @object-ui/types@4.7.0
  - @object-ui/core@4.7.0
  - @object-ui/react@4.7.0
  - @object-ui/components@4.7.0
  - @object-ui/plugin-charts@4.7.0

## 4.6.0

### Patch Changes

- Updated dependencies [3ee436d]
  - @object-ui/components@4.6.0
  - @object-ui/plugin-kanban@4.6.0
  - @object-ui/plugin-charts@4.6.0
  - @object-ui/types@4.6.0
  - @object-ui/core@4.6.0
  - @object-ui/react@4.6.0

## 4.5.0

### Patch Changes

- Updated dependencies [ab5e281]
- Updated dependencies [6b6afd1]
- Updated dependencies [aa7855f]
- Updated dependencies [170d89f]
  - @object-ui/types@4.5.0
  - @object-ui/components@4.5.0
  - @object-ui/core@4.5.0
  - @object-ui/plugin-charts@4.5.0
  - @object-ui/plugin-kanban@4.5.0
  - @object-ui/react@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [2bd45af]
  - @object-ui/components@4.4.0
  - @object-ui/plugin-kanban@4.4.0
  - @object-ui/plugin-charts@4.4.0
  - @object-ui/types@4.4.0
  - @object-ui/core@4.4.0
  - @object-ui/react@4.4.0

## 4.3.1

### Patch Changes

- Updated dependencies [6b683c8]
  - @object-ui/components@4.3.1
  - @object-ui/plugin-charts@4.3.1
  - @object-ui/plugin-kanban@4.3.1
  - @object-ui/react@4.3.1
  - @object-ui/types@4.3.1
  - @object-ui/core@4.3.1

## 4.3.0

### Patch Changes

- Updated dependencies [4e7bc1b]
- Updated dependencies [8442c05]
  - @object-ui/components@4.3.0
  - @object-ui/plugin-charts@4.3.0
  - @object-ui/plugin-kanban@4.3.0
  - @object-ui/react@4.3.0
  - @object-ui/types@4.3.0
  - @object-ui/core@4.3.0

## 4.2.1

### Patch Changes

- @object-ui/types@4.2.1
- @object-ui/core@4.2.1
- @object-ui/react@4.2.1
- @object-ui/components@4.2.1
- @object-ui/plugin-charts@4.2.1
- @object-ui/plugin-kanban@4.2.1

## 4.2.0

### Patch Changes

- @object-ui/components@4.2.0
- @object-ui/plugin-charts@4.2.0
- @object-ui/plugin-kanban@4.2.0
- @object-ui/react@4.2.0
- @object-ui/types@4.2.0
- @object-ui/core@4.2.0

## 4.1.0

### Patch Changes

- Updated dependencies [b4ce9e2]
  - @object-ui/plugin-charts@4.1.0
  - @object-ui/types@4.1.0
  - @object-ui/core@4.1.0
  - @object-ui/react@4.1.0
  - @object-ui/components@4.1.0
  - @object-ui/plugin-kanban@4.1.0

## 4.0.12

### Patch Changes

- @object-ui/types@4.0.12
- @object-ui/core@4.0.12
- @object-ui/react@4.0.12
- @object-ui/components@4.0.12
- @object-ui/plugin-charts@4.0.12
- @object-ui/plugin-kanban@4.0.12

## 4.0.11

### Patch Changes

- @object-ui/components@4.0.11
- @object-ui/plugin-charts@4.0.11
- @object-ui/plugin-kanban@4.0.11
- @object-ui/react@4.0.11
- @object-ui/types@4.0.11
- @object-ui/core@4.0.11

## 4.0.10

### Patch Changes

- @object-ui/types@4.0.10
- @object-ui/core@4.0.10
- @object-ui/react@4.0.10
- @object-ui/components@4.0.10
- @object-ui/plugin-charts@4.0.10
- @object-ui/plugin-kanban@4.0.10

## 4.0.9

### Patch Changes

- @object-ui/types@4.0.9
- @object-ui/core@4.0.9
- @object-ui/react@4.0.9
- @object-ui/components@4.0.9
- @object-ui/plugin-charts@4.0.9
- @object-ui/plugin-kanban@4.0.9

## 4.0.8

### Patch Changes

- @object-ui/components@4.0.8
- @object-ui/plugin-charts@4.0.8
- @object-ui/react@4.0.8
- @object-ui/plugin-kanban@4.0.8
- @object-ui/types@4.0.8
- @object-ui/core@4.0.8

## 4.0.7

### Patch Changes

- Updated dependencies [7c9b85c]
  - @object-ui/core@4.0.7
  - @object-ui/react@4.0.7
  - @object-ui/components@4.0.7
  - @object-ui/plugin-kanban@4.0.7
  - @object-ui/plugin-charts@4.0.7
  - @object-ui/types@4.0.7

## 4.0.6

### Patch Changes

- 1b6dc64: fix: complete Tailwind v3→v4 migration cleanup

  - Rename deprecated `flex-shrink-0` → `shrink-0` and `flex-grow-N` →
    `grow-N` (Tailwind v4 dropped the long-form aliases). Affects
    data-table, fields/index, FileField, ChatbotEnhanced,
    FloatingChatbotPanel, ProcessDesigner, HistoryPanel, KanbanEnhanced,
    KanbanImpl, plugin-timeline index, FlowDesigner, LayoutRenderer.
  - Replace `theme(spacing.4)` inside arbitrary-value `[calc(...)]` with
    literal `1rem` in sidebar.tsx — `theme()` is deprecated in v4.
  - Remove obsolete v3-escape CSS overrides from index.css and
    sidebar-fixes.css. The component source now uses native v4 stacked
    data variants (`group-data-[state=collapsed]:group-data-[collapsible=icon]:w-(--sidebar-width-icon)`)
    which Tailwind v4 emits correctly without the manual overrides.
    Only the bespoke `.sidebar-menu-button-icon-mode*` rules are kept.

- Updated dependencies [925051d]
- Updated dependencies [1b6dc64]
  - @object-ui/components@4.0.6
  - @object-ui/plugin-kanban@4.0.6
  - @object-ui/plugin-charts@4.0.6
  - @object-ui/types@4.0.6
  - @object-ui/core@4.0.6
  - @object-ui/react@4.0.6

## 4.0.5

### Patch Changes

- Updated dependencies [1dc6061]
  - @object-ui/components@4.0.5
  - @object-ui/plugin-charts@4.0.5
  - @object-ui/plugin-kanban@4.0.5
  - @object-ui/types@4.0.5
  - @object-ui/core@4.0.5
  - @object-ui/react@4.0.5

## 4.0.4

### Patch Changes

- Updated dependencies [d2b6ece]
  - @object-ui/components@4.0.4
  - @object-ui/plugin-charts@4.0.4
  - @object-ui/plugin-kanban@4.0.4
  - @object-ui/types@4.0.4
  - @object-ui/core@4.0.4
  - @object-ui/react@4.0.4

## 4.0.3

### Patch Changes

- 4be43e2: **Page-mode record forms (`editMode: 'page'`).** New per-object metadata flag that opts a record's create/edit form into a dedicated full-screen route (`/apps/:appName/:objectName/new`, `/apps/:appName/:objectName/record/:recordId/edit`). Two new declarative actions `navigate_create` and `navigate_edit` open these routes from JSON action buttons. Default modal behavior is preserved for objects that do not set `editMode`.

  **`@object-ui/plugin-list` & `@object-ui/plugin-detail`: `ComponentRegistry` singleton fix.** Both plugins' Vite configs now mark all `@object-ui/*` packages as external so each plugin no longer bundles its own private copy of `@object-ui/core`. Cross-plugin component lookups now resolve correctly from the same singleton registry. `plugin-list` dist shrank from multi-MB to 67 kB (gzip 16 kB); `plugin-detail` to 124 kB (gzip 28 kB).

  **`@object-ui/app-shell` `CreateViewDialog` churn fix.** `existingSet` is now memoised on the joined string key of `existingLabels` rather than the raw array reference, preventing the name-suggest `useEffect` from re-firing on every parent render.

  **CI fixes.** `ReportViewer` conditional-formatting test now accepts both `rgb(...)` and hex color representations. `ObjectView` i18n mocks rewritten to mirror the real hook shapes (`useObjectTranslation`, `useObjectLabel`).

- Updated dependencies [4be43e2]
  - @object-ui/types@4.0.3
  - @object-ui/core@4.0.3
  - @object-ui/react@4.0.3
  - @object-ui/components@4.0.3
  - @object-ui/plugin-charts@4.0.3
  - @object-ui/plugin-kanban@4.0.3

## 4.0.1

### Patch Changes

- @object-ui/types@4.0.1
- @object-ui/core@4.0.1
- @object-ui/react@4.0.1
- @object-ui/components@4.0.1
- @object-ui/plugin-charts@4.0.1
- @object-ui/plugin-kanban@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies
  - @object-ui/types@4.0.0
  - @object-ui/components@4.0.0
  - @object-ui/core@4.0.0
  - @object-ui/plugin-charts@4.0.0
  - @object-ui/plugin-kanban@4.0.0
  - @object-ui/react@4.0.0

## 3.4.0

### Patch Changes

- Updated dependencies [a2d7023]
- Updated dependencies [f1ca238]
- Updated dependencies [de881ef]
- Updated dependencies [b2be122]
  - @object-ui/components@3.4.0
  - @object-ui/plugin-kanban@3.4.0
  - @object-ui/types@3.4.0
  - @object-ui/plugin-charts@3.4.0
  - @object-ui/core@3.4.0
  - @object-ui/react@3.4.0

## 3.3.2

### Patch Changes

- @object-ui/types@3.3.2
- @object-ui/core@3.3.2
- @object-ui/react@3.3.2
- @object-ui/components@3.3.2
- @object-ui/plugin-charts@3.3.2
- @object-ui/plugin-kanban@3.3.2

## 3.3.1

### Patch Changes

- Updated dependencies [b429568]
  - @object-ui/components@3.3.1
  - @object-ui/plugin-charts@3.3.1
  - @object-ui/plugin-kanban@3.3.1
  - @object-ui/types@3.3.1
  - @object-ui/core@3.3.1
  - @object-ui/react@3.3.1

## 3.3.0

### Patch Changes

- @object-ui/types@3.3.0
- @object-ui/core@3.3.0
- @object-ui/react@3.3.0
- @object-ui/components@3.3.0
- @object-ui/plugin-charts@3.3.0
- @object-ui/plugin-kanban@3.3.0

## 3.2.0

### Patch Changes

- @object-ui/types@3.2.0
- @object-ui/core@3.2.0
- @object-ui/react@3.2.0
- @object-ui/components@3.2.0
- @object-ui/plugin-charts@3.2.0
- @object-ui/plugin-kanban@3.2.0

## 3.1.5

### Patch Changes

- @object-ui/react@3.1.5
- @object-ui/components@3.1.5
- @object-ui/plugin-charts@3.1.5
- @object-ui/plugin-kanban@3.1.5
- @object-ui/types@3.1.5
- @object-ui/core@3.1.5

## 3.1.4

### Patch Changes

- @object-ui/types@3.1.4
- @object-ui/core@3.1.4
- @object-ui/react@3.1.4
- @object-ui/components@3.1.4
- @object-ui/plugin-charts@3.1.4
- @object-ui/plugin-kanban@3.1.4

## 3.1.3

### Patch Changes

- @object-ui/types@3.1.3
- @object-ui/core@3.1.3
- @object-ui/react@3.1.3
- @object-ui/components@3.1.3
- @object-ui/plugin-charts@3.1.3
- @object-ui/plugin-kanban@3.1.3

## 3.1.2

### Patch Changes

- @object-ui/types@3.1.2
- @object-ui/core@3.1.2
- @object-ui/react@3.1.2
- @object-ui/components@3.1.2
- @object-ui/plugin-charts@3.1.2
- @object-ui/plugin-kanban@3.1.2

## 3.1.1

### Patch Changes

- Updated dependencies
  - @object-ui/types@3.1.1
  - @object-ui/components@3.1.1
  - @object-ui/core@3.1.1
  - @object-ui/plugin-charts@3.1.1
  - @object-ui/plugin-kanban@3.1.1
  - @object-ui/react@3.1.1

## 3.0.3

### Patch Changes

- @object-ui/types@3.0.3
- @object-ui/core@3.0.3
- @object-ui/react@3.0.3
- @object-ui/components@3.0.3
- @object-ui/plugin-charts@3.0.3
- @object-ui/plugin-kanban@3.0.3

## 3.0.2

### Patch Changes

- @object-ui/types@3.0.2
- @object-ui/core@3.0.2
- @object-ui/react@3.0.2
- @object-ui/components@3.0.2
- @object-ui/plugin-charts@3.0.2
- @object-ui/plugin-kanban@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies [adf2cc0]
  - @object-ui/react@3.0.1
  - @object-ui/components@3.0.1
  - @object-ui/plugin-charts@3.0.1
  - @object-ui/plugin-kanban@3.0.1
  - @object-ui/types@3.0.1
  - @object-ui/core@3.0.1

## 3.0.0

### Minor Changes

- 87979c3: Upgrade to @objectstack v3.0.0 and console bundle optimization
  - Upgraded all @objectstack/\* packages from ^2.0.7 to ^3.0.0
  - Breaking change migrations: Hub → Cloud namespace, definePlugin removed, PaginatedResult.value → .records, PaginatedResult.count → .total, client.meta.getObject() → client.meta.getItem()
  - Console bundle optimization: split monolithic 3.7 MB chunk into 17 granular cacheable chunks (95% main entry reduction)
  - Added gzip + brotli pre-compression via vite-plugin-compression2
  - Lazy MSW loading for build:server (~150 KB gzip saved)
  - Added bundle analysis with rollup-plugin-visualizer

### Patch Changes

- Updated dependencies [87979c3]
  - @object-ui/types@3.0.0
  - @object-ui/core@3.0.0
  - @object-ui/react@3.0.0
  - @object-ui/components@3.0.0
  - @object-ui/plugin-charts@3.0.0
  - @object-ui/plugin-kanban@3.0.0

## 2.0.0

### Major Changes

- b859617: Release v1.0.0 — unify all package versions to 1.0.0

### Patch Changes

- Updated dependencies [b859617]
  - @object-ui/types@2.0.0
  - @object-ui/core@2.0.0
  - @object-ui/react@2.0.0
  - @object-ui/components@2.0.0
  - @object-ui/plugin-charts@2.0.0
  - @object-ui/plugin-kanban@2.0.0

## 0.3.1

### Patch Changes

- Maintenance release - Documentation and build improvements
- Updated dependencies
  - @object-ui/types@0.3.1
  - @object-ui/core@0.3.1
  - @object-ui/react@0.3.1
  - @object-ui/components@0.3.1
  - @object-ui/plugin-kanban@0.3.1
  - @object-ui/plugin-charts@0.3.1

## 0.3.0

### Minor Changes

- Unified version across all packages to 0.3.0 for consistent versioning

## 0.1.1

### Patch Changes

- New plugin-object and ObjectQL SDK updates

  **Added:**

  - New Plugin: @object-ui/plugin-object - ObjectQL plugin for automatic table and form generation
    - ObjectTable: Auto-generates tables from ObjectQL object schemas
    - ObjectForm: Auto-generates forms from ObjectQL object schemas with create/edit/view modes
    - Full TypeScript support with comprehensive type definitions
  - Type Definitions: Added ObjectTableSchema and ObjectFormSchema to @object-ui/types
  - ObjectQL Integration: Enhanced ObjectQLDataSource with getObjectSchema() method using MetadataApiClient

  **Changed:**

  - Updated @objectql/sdk from ^1.8.3 to ^1.9.1
  - Updated @objectql/types from ^1.8.3 to ^1.9.1

- Updated dependencies
  - @object-ui/types@0.3.0
  - @object-ui/core@0.2.2
  - @object-ui/react@0.2.2
  - @object-ui/components@0.2.2
  - @object-ui/plugin-charts@0.2.2
  - @object-ui/plugin-kanban@0.2.2
