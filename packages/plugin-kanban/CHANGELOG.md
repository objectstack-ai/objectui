# @object-ui/plugin-kanban

## 17.7.0

### Minor Changes

- b3d562c: One authority for `MarkdownSchema`, and for `KanbanCard` / `KanbanColumn`
  inside `@object-ui/plugin-kanban` (objectui#6172, folding in objectui#6155).
  
  The 2026-08-25 family ruling: every exported schema name has exactly one
  authority. Two of this card's names are discharged here.
  
  **`MarkdownSchema` — converged onto `@object-ui/types`.**
  `@object-ui/plugin-markdown` declared a second copy of the name. The two
  differed on exactly one member — `content`, required in `@object-ui/types` and
  optional in the plugin — and that was measured to be drift rather than a real
  semantic difference: the plugin's own registration declares the `content` input
  `required: true` (pinned by its own test), `MarkdownImplProps.content` is a
  non-optional `string`, the Zod mirror spells `z.string()`, and every authored
  `type: 'markdown'` node in the repository supplies `content`. The plugin now
  re-exports the one authority.
  
  ⚠️ **Breaking, in the narrowing direction, for `@object-ui/plugin-markdown`
  consumers**: `MarkdownSchema['content']` goes from optional to **required**. A
  value annotated `MarkdownSchema` that omitted `content` no longer type-checks.
  Measured against this repository: zero authored markdown nodes omit it, so
  nothing in-tree changed. (`type: 'markdown'` literals that carry no `content`
  are rich-text FIELD metadata — `MarkdownFieldMetadata` — a different type.)
  The plugin's face also gains the optional `sanitize` and `components` members
  the canonical declaration carries; both are additive, and neither is read by
  this renderer, which sanitizes unconditionally.
  
  `className` is unaffected — it comes from `BaseSchema`, which both copies
  extended, so it was always inherited rather than added by the plugin.
  
  **`KanbanCard` / `KanbanColumn` — the three in-package copies converged to
  one.** `KanbanImpl.tsx` and `KanbanEnhanced.tsx` each redeclared both names. A
  TypeScript-AST comparison found them strict-SUBSET copies of `./types` with
  nothing typed differently, so their extra members moved onto the one
  declaration and both files now re-point at it.
  
  Additive for consumers: `KanbanCard` gains `cardSubtitle`, `cardFieldCells` and
  `coverImage`; `KanbanColumn` gains `collapsed`. All four are optional, so every
  value that type-checked before still does. Both modules keep their previous
  export surface via re-export, so no import path changes.
  
  The cross-package `KanbanCard` / `KanbanColumn` / `KanbanSchema` collision
  between `@object-ui/types` and `@object-ui/plugin-kanban` is NOT resolved here
  and is escalated on objectui#6172 — those are two different dialects (`items`
  vs `cards`, `labels` vs `badges`), and collapsing them renames a published
  name, which needs an authority ruling.
- 6ca6e12: ⏱ **Dated reading — every measurement below was taken on 2026-09-06 (`6ca6e12a7`),
  and five later cards have since falsified parts of it. It is kept as a dated reading
  rather than silently overwritten: it was TRUE when written, and overwriting that is
  a false record of its own (objectui#9713).**
  
  | reading below | falsified by | landed |
  | --- | --- | --- |
  | the component is registered under TWO node type keys, and `KanbanSchema` is one of the two declared node types | objectui#8802 — the bare `kanban` key and its `KanbanSchema` arm retired, and the prop narrowed back to the single `ObjectKanbanSchema` arm, which is exactly the narrowing the note below made conditional on a registration being removed first | 2026-09-10 |
  | `ObjectKanbanSchema` declares `objectName` REQUIRED | objectui#7780 (PR objectui#8412) — a record-source presence rule; `objectName` is optional | 2026-09-07 |
  | `ObjectKanbanSchema` declares `groupBy` REQUIRED | objectui#8990 (PR objectui#9021) — optional, as the protocol declares it | 2026-09-10 |
  | `filter` is declared by NEITHER face | objectui#8174 (PR objectui#8788) — declared on `ObjectKanbanSchema` | 2026-09-09 |
  | `columns` and `cardTitle` are `KanbanSchema`-only | objectui#8913 (PR objectui#8989) and objectui#9606 (PR objectui#9709) — both are now declared on `ObjectKanbanSchema` | 2026-09-10, 2026-09-17 |
  
  ⇒ All five **ROTTED**; none was born false. Each was measured true on 2026-09-06 and
  falsified afterwards by a card that had no reason to read this file. ⛔ Every reading
  below therefore carries the date it was taken, and none is restated in the undated
  present tense — that tense is the construction that rotted, and a re-measurement
  written in it would only rot again before this entry publishes.
  
  `ObjectKanbanComponentProps.schema` names both node types the component is registered for
  (objectui#7322 item ②, following the objectui#5903 / #5018 land shape).
  
  `ObjectKanbanRenderer` is registered under two keys — `'object-kanban'` and `'kanban'` —
  and the two keys have different declared node types: `ObjectKanbanSchema` (`type:
  'object-kanban'`, `objectName` and `groupBy` required) and `KanbanSchema` (`type:
  'kanban'`, both optional). The prop named `KanbanSchema` alone, so **no `object-kanban`
  node was assignable to the component that renders it**, and the discriminants are disjoint
  string literals, so no cast-free annotation existed for half the boards this component
  serves. It is now the union of the two — **as of 2026-09-06**; objectui#8802 then
  retired the second arm and the prop narrowed back to one, which is the dated-reading
  block above.
  
  ## What settled it: the read set
  
  `ObjectKanban` reads more keys off `schema` than either declaration covered on its own —
  that read set is the bullet list below, and each arm is load-bearing:
  
  - `objectName`, `groupBy`, `limit`, `cardFields` — declared on both;
  - `columns`, `cardTitle`, `swimlaneField`, `grouping` — `KanbanSchema` only **as of
    2026-09-06**. `columns` (objectui#8913) and `cardTitle` (objectui#9606) have since been
    declared on `ObjectKanbanSchema`, and `KanbanSchema` itself retired (objectui#8802), so
    of these four only `swimlaneField` and `grouping` were still declared by no face when
    that was re-read on 2026-09-17;
  - `titleField` — `ObjectKanbanSchema` only (which is why that read was spelled
    `(schema as any).titleField`);
  - `data`, `bind`, `className` — `BaseSchema`;
  - `filter` — declared by **neither** face **as of 2026-09-06**, still riding
    `BaseSchema`'s index signature then; objectui#8174 (PR objectui#8788) declared it on
    `ObjectKanbanSchema` on 2026-09-09. Measured and reported, **not** changed here: this
    card moves the prop, not the two published schema faces.
  
  ⏱ **Two cardinals removed on 2026-09-17 (objectui#9726), ⛔ not replaced with newer
  ones.** This paragraph read 「reads thirteen keys off `schema`」 and 「the two TOGETHER cover
  twelve」. Re-measured BY BINDING — property reads off the component's own `schema` prop, with
  `resolveKanbanTitleField`'s same-named parameter excluded by region — the read set is **14**
  today and was **14** at this entry's own measurement commit `6ca6e12a7`, because the bullets
  above omit `navigation`, which this entry's own 「Casts this removes」 section names as a read
  (`(schema as any).navigation` then, `schema.navigation` now). ⇒ 「thirteen」 was one short when
  it was written — **born false**, ⛔ not rotted afterwards, which is why it gets no row in
  the dated table above: that table records readings something LATER falsified, and nothing
  falsified this one, it arrived wrong. ⛔ The table's 「none was born false」 is a statement
  about those five rows, not about this cardinal. It is not restated as 14: a cardinal in an
  entry that publishes verbatim is derived once and then never again, and the bullets above
  already ARE the set. Which face declares each of them is `ObjectKanbanSchema`'s answer, and
  `tsc` already reads it.
  
  So naming `ObjectKanbanSchema` alone — the remedy the original card implied — would have
  been wrong in the other direction: it drops four declared reads and the `'kanban'`
  registration.
  
  ## Not affected
  
  Widening a member of an exported prop type is additive: every caller that passed a
  `KanbanSchema` still compiles, and the union claims exactly the accept set the registry
  dispatches to this component — a third node type is still turned away. The runtime is
  untouched; `ObjectKanbanRenderer` still takes `schema: any`, so no shape is turned away
  there either (the objectui#5903 disposition, restated). The view-level `kanban.groupField`
  alias, `BaseSchema`'s index signature, and `@object-ui/types` are all untouched.
  
  ## Casts this removes
  
  Inside `ObjectKanban.tsx`, three schema-key reads drop their `as any`: `titleField` (two
  sites, now honest because the `object-kanban` arm declares it) and `cardFields` /
  `cardTitle` (already declared; the casts were redundant). `(schema as any).navigation`
  **stays** — `navigation` is declared on neither face, so removing the cast would change
  nothing but the spelling of an index-signature read.
  
  Four of the six in-package fixtures that mount an `object-kanban` board drop their
  `as never` escape for a real `satisfies ObjectKanbanSchema`. The other two are static
  boards (`columns` + inline `data`, no fetch) that author no `objectName`, which
  `ObjectKanbanSchema` declared required **as of 2026-09-06** — objectui#7780's subject,
  and that card made it a record-source presence rule on 2026-09-07; their casts stay,
  now carrying the reason and the card number.
- 0ead1f6: Declare the `filter` input on every `object-kanban` / `object-calendar`
  registration (objectui#7712) — the html tier stops reporting `unknown-prop` on a
  key the spec declares and both renderers read.
  
  `ObjectKanban.tsx` sends the authored key to the query as `$filter: schema.filter`
  and `ObjectCalendar.tsx` does the same, and `@objectstack/spec`'s
  `ComponentPropsMap` declares `filter` on both blocks (measured: `safeParse`
  accepts it, and refuses an undeclared key by name on the same call). But none of
  the four registrations that publish those two renderers listed `filter` in
  `inputs`, and `sdui-parser`'s `validateTree` reports `unknown-prop` for every key
  no `inputs` entry claims. So an author writing the one spelling that WORKS was
  told it was unknown — objectui#6678's shape, where a correct write draws the same
  diagnostic as a write that does nothing. That is worse than an inert key: it
  actively punishes the correct behaviour, and the honest response to it is to
  delete working metadata.
  
  ADR-0049 enforce-or-remove resolves toward **declare**, not remove: the key has
  live readers on both ends, so the registrations were the side that was wrong. The
  declaration is `type: 'array'` on all four, matching the `filter` that
  `object-grid`'s `GRID_QUERY_INPUTS` and `object-metric` already publish, and it is
  writable as one shape only because objectui#7711 landed first and retired the
  object-shaped `filter.calendar` spelling — `filter` is the query filter and
  nothing else.
  
  Declared per key against the spec rather than derived from the
  `ElementDataSourceMapping` sitting beside these registrations, even though that
  mapping already asserts `filter` is a live query key. Measured, that derivation
  would be wrong: the kanban mapping also carries `limit`, and the spec's strict
  `ComponentPropsMap['object-kanban']` **rejects** `limit` by name, so emitting it
  would publish a key the save gate refuses.
  
  ⚠️ Note for whoever meets this class next: `check:react-blocks-declaration-parity`
  runs manifest → spec, one direction. A key the SPEC declares and the manifest
  omits is structurally outside what that ratchet measures, so fixing these four
  registrations does **not** make the next omission loud. Making that ratchet
  bidirectional is its own card.
- dcbf0b2: **BREAKING (scored `minor` per this repo's version-alignment convention)** — the
  `'kanban'` arm retires four accepted spellings and declares one read it never
  named (objectui#7742, ADR-0049, maintainer decision batch #70, 2026-09-07:
  「同意」).
  
  The accept set moves in **both** directions in one change, which is why the PR
  carries `needs:contract-review`.
  
  ## Narrowing — four keys the `'kanban'` arm no longer accepts
  
  Each is a `?: never` tombstone on the TypeScript face and a named refusal arm on
  the `@object-ui/types/zod` mirror, so a document that names one is **refused by
  name** with the remedy in the message. ⛔ None is dropped instead of refused:
  `BaseSchema` is `.passthrough()`, so a dropped key is *kept*, not refused — the
  failure objectui#7664's own first cut shipped at `onCardClick`.
  
  - **`allowCollapse`, `cardTemplates`, `columnWidths`** — declared on both faces
    since the dialect was carried over, and read by **no registered board**.
    Re-measured for this change over `packages/plugin-kanban/src`, every file
    including tests: 0 hits / 0 files each, with `groupBy` (85 hits / 27 files),
    `cardTitle` (18/9) and `coverImageField` (17/3) firing as controls on the same
    instrument. An author who wrote `allowCollapse: true` validated green and got
    a board that never collapsed off that key. Each capability exists on a
    *different* channel, and the refusal message names it: a lane's own
    `columns[].collapsed` for collapsing, a `templates` component prop for card
    templates, a `useColumnWidths` hook option for widths. Wiring a board-level
    switch to any of them would be new behaviour and is not ordered here.
    `CardTemplate` and `ColumnWidthConfig` stay exported — the prop and the hook
    still consume the types.
  - **`titleField`** — ⚠️ **not** an inertness retirement, and reading it as one
    gets the mechanism backwards. `ObjectKanban` still reads the key and the read
    stays, because the **sibling `object-kanban` arm declares it and keeps it**
    (objectui#7322 item ②). What retires is *this* arm's acceptance of the legacy
    spelling: one arm, one spelling, and the refusal points at `cardTitle`. A
    `type: "object-kanban"` document naming `titleField` still validates and still
    renders; a `type: "kanban"` one is now refused. The key was never declared on
    this face before — it rode `BaseSchema`'s index signature — so this is the
    first time this face judges it at all.
  
  ## Widening — one key the board reads and no face named
  
  - **`navigation`** is now declared on `KanbanSchema` (both faces), on the gantt
    precedent objectui#5903. `ObjectKanban` reads it to choose the record-detail
    overlay mode and defaults it to a drawer; until now an authored overlay mode
    rode `BaseSchema`'s `[key: string]: any` — admitted, never examined — and the
    read site had to spell itself `(schema as any).navigation`. That cast is gone.
    The member list is `@objectstack/spec`'s `NavigationConfig` by reference, not
    restated, so the vocabulary cannot fork.
  
  ## `@object-ui/plugin-kanban` — `objectFields` moves from the schema bag to a React prop
  
  `objectFields` (the fetched object's field definitions, which card conditional
  formatting needs so a rule comparing a relation sees the stored foreign key) is
  now a **React prop on `KanbanRendererProps`**, a sibling of `schema`, rather than
  a member of the `schema` bag. `ObjectKanban` — the one caller that fetches the
  object definition — injects it there. Callers that render `KanbanRenderer`
  directly and passed `objectFields` inside `schema` must move it to the prop.
  
  ⚠️ **What this closes, stated at the arm level** — measured through the real
  `SchemaRenderer`, not assumed. It closes the *schema read path*, and on the
  `'kanban'` arm that closes the key outright: `ObjectKanbanRenderer` serves that
  type key and discards its rest-spread (`void _props;`), so an authored
  `objectFields` on a `type: "kanban"` node reaches nothing. It does **not** make
  `objectFields` unreachable to an author in general. On the schema-only
  `'kanban-ui'` entry, which `KanbanRenderer` serves directly, the key is absent
  from `SchemaRenderer`'s stripped-metadata list, so it survives that renderer's
  generic prop spread and arrives on the very prop this change adds — an authored
  `objectFields` still reaches `resolveConditionalFormatting` there, as it did
  before, and no schema face declares or judges it. Closing that entry is a
  separate change and is not made here.
- edea22a: **BREAKING** — `SchemaRendererProvider`'s `dataSource` prop, and the context
  type every `useSchemaContext()` consumer reads back, are the published
  `DataSource` contract instead of `any`.
  
  **FROM** `dataSource={anything}` **TO** `dataSource={adapter}` — a `DataSource`
  from `@object-ui/types`, or `null` / `undefined` when the host has no adapter
  bound.
  
  ```ts
  // before — compiled, and failed at runtime on the first find()
  <SchemaRendererProvider dataSource={'not-an-adapter'}>
  // before — compiled, and no reader can do anything with it
  <SchemaRendererProvider dataSource={{}}>
  // after
  <SchemaRendererProvider dataSource={adapter}>       // a DataSource
  <SchemaRendererProvider dataSource={undefined}>     // "I have no adapter"
  ```
  
  Both sites are typed `DataSource | null | undefined` — the spelling
  `useSettledSchema` in this same package already used. The two absences are part
  of the contract, not a weakening of it: a Studio preview, a `kind:'react'` page
  rendered before the host's adapter connects, and a widget probe driving
  `apiFetch` alone all render with nothing bound, and every reader in the tree
  already guards for it. What the union refuses is everything that is not an
  adapter: a string, an empty object, a plain data bag, a partial adapter missing
  a required member.
  
  The measured cost, both halves, because the two `any`s have different blast
  radii (measured separately on `origin/main`, whole-repo type-check over the 33
  packages that depend on `@object-ui/react`):
  
  - the **context type** — the `any` that reaches every `useSchemaContext()`
    reader — reds **7 diagnostics at 7 sites in 4 packages**, all of them
    production code or a mocked module factory.
  - the **provider prop** — the injection points — reds **52 diagnostics at 27
    sites in 11 packages**, all but one of them test doubles.
  
  That ordering is the reverse of the prediction on the card: the context `any`
  was expected to be the expensive one because it infects the whole tree, and it
  is the cheap one, because every reader in the tree already guarded and none of
  them ever reached past `find` / `getObjectSchema`. The prop is the expensive
  one, because the injection points are overwhelmingly test doubles that were
  never complete adapters. The full accounting is on objectui#7912.
  
  Two runtime behaviours change, both in the "no adapter" direction and both
  strictly closer to what the surrounding code already intended:
  
  - `@object-ui/components`' `kind:'react'` page passed an empty object as its
    "no adapter yet" stand-in. An empty object is TRUTHY, so it walked past every
    `if (!dataSource)` guard written to catch exactly that state and failed later,
    at the call. It now passes the absent adapter itself, so the guard fires where
    it was meant to. The module-constant identity that stand-in existed for is
    preserved: `null` is a primitive, so the provider's memo is unaffected.
  - `@object-ui/plugin-calendar`, `@object-ui/plugin-gantt` and
    `@object-ui/plugin-kanban` collapse a `null` adapter from the context to
    `undefined` before handing it to their widget, whose prop declares the single
    spelling `dataSource?: DataSource`.
  
  Nothing else moves at runtime: no value flowing through this key changes, and
  no data path is touched. A TypeScript consumer outside this repo that handed
  this prop something other than an adapter now gets a compile error naming the
  key (TS2322 / TS2739 / TS2740), which is why the FROM/TO is spelled out above.
  
  Five `as any` reads of this context in `@object-ui/fields` are gone — they were
  redundant the moment the seam became honest — and `LookupField`'s local
  re-declaration of the imported context as a `Context` of `any`, which laundered
  its `dataSource` read while looking typed, is gone with them. Both directions of
  the contract are pinned against the real compiler in
  `SchemaRendererContext.dataSourceType.pin.test.ts`, and the card's planted
  documentation probe (a bare string in `packages/react/README.md`'s provider
  example) now fails `pnpm check:doc-snippets`, where it used to exit 0 with zero
  diagnostics.
  
  objectui#7912.
- 093af32: Take the `@objectstack/*` line to 17.4.0 and follow every contract it moved
  (objectui#8772, with #7783 · #7663 · #8172 · #7845 · #8785).
  
  **Breaking on one authored key, deliberately.** A dashboard node's
  `refreshInterval` is now `refreshIntervalSeconds` — the value is unchanged
  (seconds), and the spec refuses the old spelling by name with a message naming
  the new one, so an existing document fails loudly at parse rather than silently
  losing its auto-refresh. `os migrate meta --from 17` lists the mechanical edits.
  The report component's own `refreshInterval` is a different key and is NOT
  affected. (Scored `minor`, not `major`: this repo's fixed group tracks the
  `@objectstack` major — AGENTS.md §版本号策略.)
  
  Also authored-surface changes, all following a published spec move rather than a
  local decision:
  
  - `element:record_picker`'s `filter` input is now the `ViewFilterRule` array
    form `[{ field, operator, value }, …]`. The MongoDB-style record form is
    refused by the contract (objectstack#14406 converged the last record-form
    `filter` in the map), so a JSX page writing the array form no longer draws a
    false `type-mismatch` and one writing the record form is told.
  - `object-kanban` now publishes `limit`, the row cap its renderer has always
    lowered to `$top`. The spec declares it as of objectstack#16503, so the key
    the docs teach is finally one the save gate stores.
  - `object-gantt`'s ten extension keys (`timeSegments`, `interactions`,
    `lockField`, …) are derived from the spec's `GanttConfigSchema` instead of
    being re-declared locally. Same accept set on the flat face; the nested
    `gantt` block narrows to the spec's, which now refuses an undeclared sub-key
    by name where its `.passthrough()` window used to admit one.
  - The console's preview-gallery samples — the worked examples an author copies —
    move with two spec changes of their own: a job's `timeout` is now `timeoutMs`
    (same unit-in-the-key-name ruling as the dashboard key above), and a flow's
    end node writes `outcome: 'completed'`, the enum having narrowed to
    `completed | refused`.
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
- 7098eed: One record-overlay shell: all five list-type renderers honour all four overlay
  `navigation.mode` values (objectui#9299, director seat decision batch #128 item
  1, 2026-09-13).
  
  `ObjectGantt`, `ObjectKanban` and `ObjectCalendar` rendered one drawer for every
  authored mode — `modal`, `split` and `popover` silently WERE the drawer, with no
  diagnostic. `RecordDetailDrawer`'s payload is extracted into the new
  `RecordDetailPanel` (shell-free by construction) and mounted through the shared
  `NavigationOverlay`, which is what `ObjectGrid` and `ObjectTree` already used.
  
  User-visible on published surfaces:
  
  - **`modal` / `split` / `popover` now do what they say** on the gantt, the
    kanban and the calendar.
  - **`split` renders.** Each renderer passes its own view as `mainContent`, so
    the board / calendar / chart / tree / grid sits beside the record panel.
    Authored `split` used to render NOTHING on `ObjectTree` — and, measured while
    fixing this, on `ObjectGrid` too.
  - **`popover` is anchored to the element the user clicked** — row, node, bar,
    card, event — instead of degrading to a centred dialog. It was honoured on no
    surface before.
  - **Drawer chrome converges** on the shared shell's header (breadcrumb title,
    close, optional expand) for the three renderers that brought their own.
  - **Drawer widths carry over, they are not reset.** The two drag-resize
    implementations become one: a width persisted under the retired
    `objectui.drawerWidth.OBJECT` is read once, written forward to
    `ov:drawer-width:OBJECT` and removed. One key per object across every view
    type. The default width is unchanged at every viewport (objectui#6584); an
    authored width below `min(60vw, 880px)` now widens to it, which is the shell's
    long-standing policy on grid and tree.
  - **Richer record body on grid and tree** — typed widgets, declared labels,
    honoured `hidden` — wherever the object declares its fields. With nothing
    declared those two renderers keep their own value-inference reading, which is
    what preserves the locale-aware date fallback (objectui#4541), the localized
    empty placeholder (objectui#8491) and the `format` hint (objectui#8920); the
    overlay shell is the shared one on that path too.
  
  New published API: `RecordDetailPanel`, `buildRecordDetailFields`,
  `RECORD_OVERLAY_DEFAULT_WIDTH` (`@object-ui/plugin-detail`);
  `useOverlayAnchor`, `recordOverlayWidthStorageKey`,
  `legacyRecordDrawerWidthKey` and the `popoverAnchorRef` / `legacyStorageKey`
  props on `NavigationOverlay` (`@object-ui/components`). `RecordDetailDrawer`
  keeps its props and is now a thin wrapper over the shared shell. ⛔ No spec
  change.
- a272a4f: An `onCardClick` supplied to an `object-kanban` board runs **once** per card
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
- 55f39ee: **BREAKING (scored `minor` per this repo's version-alignment convention)** —
  `KanbanRenderer` takes `onCardMove` as an explicit React prop, and the
  `object-kanban` document face tombstones the key (objectui#9342, executing the
  `domain:ui` seat's option-B ruling on PR objectui#9338; the objectui#7742 remedy
  `objectFields` took one member over, maintainer decision batch #70).
  
  A `major` is unavailable by convention, not by preference: every package in
  `.changeset/config.json`'s `fixed` group ships as one family whose major tracks
  `@objectstack`, so `scripts/check-changeset-no-major.mjs` rejects a `major`
  declaration outright. Breaking semantics are stated here instead.
  
  ## `@object-ui/plugin-kanban` — the move, and what it breaks
  
  `onCardMove` is now a **React prop on `KanbanRendererProps`**, a sibling of
  `schema`, and is **no longer a member of the `schema` bag**. `ObjectKanban`
  passes its own `handleCardMove` through that prop.
  
  ⚠️ **This narrows a published props surface.** A host that renders
  `KanbanRenderer` directly and wrote the handler inside `schema` must move it to
  the prop: `schema={board} onCardMove={handler}`. A typed host gets a TS error; an
  untyped one gets a silent drop, which is why the change carries
  `needs:contract-review`.
  
  ## `@object-ui/types` — the key is refused by name, as a TOMBSTONE
  
  `ObjectKanbanSchema.onCardMove` is `?: never` on the TypeScript face and
  `handlerKeyRefusal('onCardMove', 'retired', …)` on the `@object-ui/types/zod`
  mirror. An authored `onCardMove` was **accepted and silently dropped** before
  this: `BaseSchema` is `.passthrough()`, so an undeclared key is not refused — it
  stops being judged and the value is KEPT — and `ObjectKanban` then substituted
  its own mover over it.
  
  ⛔ **RETIRED, not a RUNTIME SLOT**, and the two are not interchangeable here. A
  slot keeps the TypeScript twin callable, which would publish a key the
  object-bound board DROPS — the resolution this package's `quickAdd` carve-out
  forbids in as many words. The sibling `onCardClick` is a slot because its
  function reaches the board through a React prop `ObjectKanban` declares;
  `onCardMove` has no such prop, and objectui#7804 measured that by driving the
  handler the board was actually handed, with `onCardClick` as the lit control on
  the same document and the same render.
  
  ⭐ **Why it took a second card.** The disposition did not move — objectui#7804
  already measured `'retired'`. What blocked it was `check:handler-key-reads`,
  which refuses a tombstone while a renderer still reads the key off the document
  ("a tombstone exists precisely because nothing reads the key — it has no read
  site BY CONSTRUCTION"). What that gate cannot see is that the value at the read
  was substituted one hop earlier. Moving the READ is what makes both sides true
  at once, and it drains the key's `KNOWN_UNDECLARED_READS` row.
  
  ## `@object-ui/components` — the doc this makes wrong
  
  `src/renderers/complex/README-KANBAN.md` taught an `object-kanban` document
  carrying `"onCardMove": "(event) => …"` — a function spelled as a string,
  accepted and silently dropped on the day it was written and refused by name from
  now on. It teaches the React prop instead, and its prop table spells the key
  `never`.
- 502eb58: The row/card click props on the view components now declare the modifier
  payload they have always been invoked with (objectui#9357).
  
  `useNavigationOverlay`'s `handleClick` invokes the handler it is given with two
  arguments — the record, and an optional modifier payload (`metaKey` / `ctrlKey`
  / `button`) a host needs to implement Cmd/Ctrl/middle-click. objectui#9360 made
  the hook's own option say so. These components pass a host-supplied prop
  straight into that option, so the value a host writes against them is invoked
  with two arguments too — and every one of these props declared only the record.
  The payload was therefore invisible on the one line a host reads, exactly as it
  had been on the hook.
  
  Thirteen declarations across nine packages now name both parameters:
  
  - `ObjectGridComponentProps.onRowClick`
  - `ObjectKanbanComponentProps.onRowClick` (its sibling `onCardClick`, the other
    arm of the same fallback, already declared both)
  - `KanbanRendererProps.schema.onCardClick`
  - `ObjectCalendar`, `ObjectGantt`, `ObjectMap`, `ObjectTree`: `onRowClick`
  - `ObjectTimeline`: `onRowClick` and `onItemClick`, the two arms of one fallback
  - `ListView.onRowClick`
  - `ObjectGallery`: `onRowClick` and `onCardClick`, likewise two arms of one
  - `RelatedList.onRowClick`
  
  **Source-compatible, and with no refused class.** A one-parameter handler is
  still assignable to the widened signature, and a handler written against the
  widened signature was already assignable to the narrow one — its minimum
  argument count is still one. The second parameter is spelled `any` rather than
  `HandleClickModifiers`, which is the difference that matters for callers: the
  hook's own option names that interface and therefore refuses a handler whose
  second parameter is annotated narrower (objectui#9360 documents that class and
  the one-line remedy). These faces refuse nothing. A host that discovered the
  payload from the implementation and annotated it `React.MouseEvent` — which is
  what actually arrives — keeps compiling. `any` is also the spelling
  `ObjectKanbanSchema.onCardClick` already carries for this same payload
  (objectui#9341) and the one `BaseSchema`'s own `onClick` / `onChange` /
  `onSubmit` use, and it is forced on the published twins in `@object-ui/types`,
  which may not name a type that lives in a package depending on them.
  
  **Runtime behaviour is unchanged.** Nothing is newly called and nothing newly
  passes an argument; only the declarations move.
  
  Three declarations that share the name and the shape are deliberately NOT
  widened, because the value flowing through them is not invoked with the
  payload: `VirtualGrid.onRowClick`, whose second parameter is a row index;
  `ManageViewsDialog.onRowClick`, which receives a view id; and the `data-table`
  family (`DataTableSchema.onRowClick`, `ObjectDataTableSchema.onRowClick`),
  whose renderer invokes with one argument. Widening those would have declared a
  payload that never arrives.
- f7fcc2c: fix(components): Tailwind no longer compiles this package's prose into the published stylesheet
  
  `@object-ui/components`' Tailwind entry opened with a bare `@import 'tailwindcss'`
  — the only one of this repository's four stylesheet entries without a
  `source(none)` pin. Tailwind v4's automatic source detection was therefore ON,
  and it roots at the PROCESS working directory, so it scanned every non-ignored
  file in the package: `CHANGELOG.md`, `README.md`, the markdown beside the
  renderers, `shadcn-components.json`, even an English sentence in a comment inside
  `tsconfig.test.json`. Every class-shaped token in that prose compiled into a real
  rule in the published `dist/index.css`.
  
  The entry now reads `@import 'tailwindcss' source(none);`. It keeps the FULL
  Tailwind import, because this is the root sheet: preflight, the `@theme` block
  and the base layer are emitted exactly as before. Only automatic detection is
  off, so the entry's own `@source` lines are the whole input set — and the
  compiled sheet is now byte-identical whatever directory the build is launched
  from, which it previously was not.
  
  ## Breaking: 23 prose-derived utilities leave `@object-ui/components/style.css`
  
  None of these is emitted by any component under this package's `src`; each one
  existed solely because some prose in the package mentioned it. Grouped by the
  file that was creating it:
  
  - from `CHANGELOG.md` — `cursor-not-allowed`, `flex-shrink-0`, `lg:p-8`,
    `md:text-2xl`, `origin-[--radix-...]`, `pb-20`, `scale-0`, `sm:px-6`,
    `sm:py-4`, `space-y-8`, `w-[--sidebar-width]`, `xl:flex`
  - from `README.md` — `bg-blue-500`, `hover:bg-blue-700`, `text-white`
  - from `README_SHADCN_SYNC.md` — `dark:backdrop-blur-sm`, `dark:bg-background/95`
  - from the JSON examples in the renderer docs — `bg-blue-50`, `bg-gray-50`,
    `h-[600px]`, `h-[800px]`
  - from `shadcn-components.json` — a variant of `origin-[--radix-` ending in a
    typographic ellipsis
  - from a prose comment in `tsconfig.test.json` — `invert`, which is an ordinary
    English word there
  
  Two of them are worth calling out. `flex-shrink-0` is a deprecated Tailwind v3
  alias this repository deliberately migrated away from, and it was shipping only
  because the changelog entry announcing that migration names it.
  `w-[--sidebar-width]` and the `origin-[--radix-` pair are the v3 bracket syntax,
  shipping only because the changelog entry recording the move to v4 syntax quotes
  the old spelling. A consumer who had come to rely on any of the 23 should add it
  to their own Tailwind sources; they were never this package's to publish.
  
  ## Fixed: three sibling packages get back classes their own components emit
  
  The plugin stylesheets subtract every rule `@object-ui/components` already
  ships, so any class the prose invented was subtracted out of THEIR sheets while
  their components still emitted it — under-styled published packages with a green
  build. Restored by this change:
  
  - `@object-ui/plugin-kanban` — `h-[600px]`, `sm:px-6`, `sm:py-4`
  - `@object-ui/plugin-grid` — `bg-blue-50`, `cursor-not-allowed`
  - `@object-ui/fields` — `bg-blue-50`, `bg-blue-500`, `bg-gray-50`, `text-white`
  
  The same mechanism was also a loaded gun for the release lane: `changeset:version`
  writes changeset bodies into `packages/components/CHANGELOG.md`, so a changeset
  that merely QUOTED a class name promoted it to a real utility in this sheet and
  stripped it out of the plugin sheets at the next release. That is no longer
  possible for these four packages — which is why this body can safely quote 23
  class names.
  
  ## Why `minor` rather than `patch`
  
  Removing utilities from a published stylesheet is a contraction of a published
  artifact, so it carries a breaking semantic. This repository does not ship
  `major` outside the `@objectstack` major-sync release, and marks its own breaking
  changes `minor` with the break spelled out — which is what the section above is.
- dea17b4: Honour `columns[].collapsed` on the registered kanban board (objectui#9628).
  
  The key was declared on **both** published faces of the `object-kanban` arm — the lane
  element of `ObjectKanbanSchema` (`objectql.ts` and its Zod mirror) and the runtime lane
  `KanbanColumn` (`complex.ts` and its mirror) — and read by `KanbanEnhanced` alone, a
  module no production source imports. An authored `{ "id": "todo", "title": "To Do",
  "collapsed": true }` therefore parsed green on both faces and reached a board that did
  nothing with it: `KanbanImpl`'s only collapse is the SWIMLANE row's, held in viewer
  state under `objectui:kanban-collapsed:<swimlaneField>` and never keyed to a lane's
  declared value. That is the ADR-0049 declared-but-unhonoured shape.
  
  **The repair is at the reader, not at the declaration.** Retiring the key would narrow a
  published accept set, and it would also strand objectui#8801's retirement tombstone,
  which names `KanbanColumn.collapsed` as where lane collapse lives. Honouring it moves no
  accept set in either direction: both faces already declare the member, and
  `@objectstack/spec` declares the lane element as `z.unknown()`, so the protocol neither
  names the key nor refuses it. Nothing that parsed before parses differently now.
  
  **What an authored `collapsed: true` does.** The lane renders narrowed to a title spine
  with its cards withheld, on **both** of the board's layouts — the flat lane and the
  column cells of each swimlane row — and its heading becomes a disclosure the viewer can
  open. That is the meaning `KanbanEnhanced` already gave the key, so the platform states
  one behaviour for it rather than two.
  
  The authored value is the lane's **initial** state. A viewer's own toggle wins after
  that and survives the data refreshes that rebuild the lane objects: the board holds the
  viewer's overrides and resolves them against the current prop, rather than copying the
  authored flags into state where every refetch would re-collapse a lane the viewer had
  opened. A lane whose cards could never be reached again — and whose drop target was
  blind — would have been a worse board than the one that ignored the key.
  
  **No change to a board that does not author the key.** The disclosure appears only on a
  lane that declared `collapsed: true`, so an omitted key and an authored `collapsed:
  false` are indistinguishable, and a board authoring neither renders the DOM it rendered
  before. The published `describe` text and docblocks on both faces, the plugin README and
  the plugin docs page stop pointing authors at the unregistered board.

### Patch Changes

- 062943f: `@object-ui/plugin-grid` and `@object-ui/plugin-kanban` now publish a stylesheet —
  `"./style.css"`, mapped to `dist/index.css` and compiled at build time from the package's
  own sources (objectui#4929, maintainer ruling 2026-08-17, Direction 1).
  
  **What was broken.** Only `@object-ui/components` and `@object-ui/fields` shipped CSS, and
  each scans its own `src` only, so a class used exclusively by a plugin could not appear in
  either sheet BY CONSTRUCTION. A published-state Vite app that installed one of these two
  plugins and followed the quick-start rendered the grid or the board with **25 themed
  utilities that had no source anywhere in the world** — `bg-muted/10`, `bg-card/60`,
  `text-muted-foreground/60`, `ring-primary/40` and friends, ordinary appearance classes —
  plus ~103 plain ones. Re-measured on the merged tree: the 21 the card listed all still hold,
  and four more (`[&>h3]:text-foreground/80`, `border-l-primary/40`, `border-primary/30`,
  `hover:text-primary`) that its literal-grep method could not see.
  
  The plain utilities a consumer could in principle regenerate by pointing `@source` at the
  package's `dist`. The themed ones they cannot, at all: they resolve `@theme` tokens declared
  in `packages/components/src/index.css`, which that package does not publish. A build inside
  this monorepo is their only possible producer — which is why the fix is a stylesheet we
  ship, not documentation teaching consumers to hand-declare the theme and scan
  `node_modules` (the advice objectui#4858 had just retired from the guides).
  
  **The shape**, inherited from `@object-ui/fields` (objectui#4059): each package gains
  `src/index.css` that `@reference`s the components entry — theme tokens, the class-based
  `dark` variant and the animate plugin become available for resolution while emitting
  nothing — plus `scripts/build-css.mjs`, which subtracts every rule components' published
  sheet already ships. So these are **supplements, imported after** the components sheet, and
  they are 16.30 kB and 11.41 kB rather than another ~170 kB each:
  
  ```css
  @import 'tailwindcss';
  @import '@object-ui/components/style.css';
  @import '@object-ui/fields/style.css';
  @import '@object-ui/plugin-grid/style.css';
  @import '@object-ui/plugin-kanban/style.css';
  ```
  
  Add a line only for the plugins you install; no other `@object-ui/plugin-*` package
  publishes a stylesheet yet. The build step is shared
  (`scripts/build-plugin-stylesheet.mjs`) so it is the pattern the next one inherits rather
  than a file to copy, and it refuses to write a sheet that fails any of four assertions — no
  rule may vanish, the subtraction must have removed something, the class count may not pass
  a leak ceiling, and named themed utilities only this build can produce must still be
  present.
  
  Nothing is removed and no existing import changes: a consumer who does not import the new
  sheets is exactly where they were, and the guides' "do not scan `node_modules`" advice
  stays correct — it is now correct for plugins too.
- 39f4309: Published typings from every `vite-plugin-dts` package now carry an explicit extension on
  every relative specifier, and a type error in the declaration build now fails the build
  instead of being printed and ignored (objectui#5439, objectui#5483).
  
  **Consumers on `moduleResolution: nodenext` or `node16` may see NEW type errors, and that
  is the fix working.** These packages re-export mostly through NAMED re-exports —
  `export { useObjectChat } from './useObjectChat'`. TypeScript could not follow the
  extensionless hop, but it still DECLARED the name, so the symbol resolved to a silent
  `any`. Nothing errored; consumers simply got no types. With the extension emitted, the
  symbol carries its real type, and any call site that was relying on the `any` now type
  checks for the first time. This is the mode that produced the 21 residual `TS7006` on
  `@object-ui/app-shell` reported against objectui#5365 — a type hole that opened quietly,
  unlike objectui#5365's own `export * from './ui'` packages where the same defect surfaced
  immediately as `TS2305: has no exported member`.
  
  410 extensionless relative specifiers across 19 packages were emitted before this change;
  the count is now 0 in all 22 packages that build typings through `vite-plugin-dts`.
  `@object-ui/fields` was already clean — its sources write explicit `.js` specifiers — and
  is wired so it stays that way.
  
  The second half changes no emitted output today: 22/22 packages built green unmodified, so
  making the declaration step's exit code honest turns nothing red. It changes what a FUTURE
  regression does — print and exit 0, versus fail the build.
- 7c96c94: Four more private copies of the reference-bearing field family converge onto
  `@object-ui/core`'s `EXPANDABLE_FIELD_TYPES`, and the "fourth and last private copy" claim
  that `paramToField` still stated is corrected (objectui#5874, objectui#5875).
  
  Each copy diverged from the published family in BOTH directions, so this is a behaviour
  change on every face and not a refactor:
  
  - **`user` and `tree` are now treated as relations.** Both carry the same foreign-key
    storage as `lookup` and resolve through the same expand path (objectui#2032), and each
    face's own stated reason for special-casing `lookup` applied to them verbatim — so
    gaining them restores the rule each face already meant. A `user` / `tree` field is now
    read-only in the quick-look drawer (`RecordDetailDrawer`), where the drawer wires no
    relation picker and a plain text input let a user overwrite the relation with a
    free-form string; it gets the wide layout basis in the record header's highlights strip
    (`HeaderHighlight`), whose inline editor is a record picker; and a field-backed action
    param over one now inherits the picker config it needs (`resolveActionParams`).
  - **`master_detail` is now treated as a relation by `resolveActionParams` too** — it was
    the only face missing that member as well, so a field-backed `master_detail` action param
    inherited no `referenceTo` at all and degraded to the unexplained "paste a record id"
    text input that objectui#3405 exists to prevent.
  - **The undeclarable `reference` spelling is gone from the three field-type faces.**
    Measured against `@objectstack/spec`'s closed `FieldType` vocabulary with live controls
    (`lookup` / `master_detail` / `user` / `tree`) and dead ones (the retired `owner`, plus a
    nonsense spelling): `reference` is absent, so no spec-compliant object schema could
    declare a field that reached those branches. It sat exactly where `owner` sat before
    objectui#4814 retired it — dead weight that read as live capability.
  
  `resolveActionParams` keeps answering for `reference`, deliberately and by a different
  route: it is refused by the spec's `ActionParamSchema` too, but the dialog still accepts it
  from params already authored with it, and that acceptance belongs to the one alias table in
  `paramToField` rather than to a hand-copied membership test. This face now asks the shared
  family over the widget key that table produces — the same expression `paramToField`
  evaluates one step later, so the half that populates a param's picker config and the half
  that forwards it can no longer disagree.
  
  No face copies the set: each calls `.has()` on the object `@object-ui/core` exports, and
  each carries an identity pin (a spy on that `has`) so a member-identical private copy fails
  instead of quietly re-forking the table.
- 3e853c9: Let a producer-marked refusal reach the drag-write surfaces (objectui#5902).
  
  The kanban card-move toast, the calendar drag-to-reschedule toast and the OCC
  conflict dialog each substituted a generic string for a refusal the producer had
  marked as user-facing (`userMessage`), so a user was told "Save failed" where the
  application author had written a sentence addressed to them. All three now read
  the marking through the shared `declaredUserMessage` reader, which covers both
  places the adapter boundary parks it — the typed member on
  `ConcurrentUpdateError` and the details bag on `DataApiValidationError`.
  
  Nothing unmarked changes: the reader answers `null` for it, so every existing
  generic substitution — including the localized "not authorized" message that
  keeps raw server diagnostics away from end users — still governs unmarked
  refusals exactly as before.
  
  The two toasts substitute; the conflict dialog augments. Its description also
  explains what the destructive "Overwrite" button does, which is affordance copy
  that surface owns rather than a refusal message, so the marking leads and that
  paragraph stays.
- a76b18c: `ObjectKanban`'s `resolveDisplay` drops an unreachable relation-type guard, and the rule
  that survives it is pinned (objectui#6063).
  
  The helper that builds card descriptions ended:
  
  ```ts
  const isLookup = isExpandableFieldType(def);
  if (isLookup && isOpaqueId(raw)) return undefined;
  if (isOpaqueId(raw)) return undefined;
  return raw;
  ```
  
  The second line subsumes the first for every input — same `raw` (a `const`, unmodified
  between the two lines), same predicate, and `OPAQUE_ID_RE` carries no `g`/`y` flag, so
  repeated `.test()` on it is stateless. `isLookup` was computed, branched on and discarded.
  
  **No behaviour changes on any board.** The card named a second reading — that the
  unconditional line was the mistake and only relation columns were meant to suppress
  id-shaped values — and it was rejected on evidence rather than by tidying first: the
  helper's own docblock declares both clauses, the same predicate is already applied with no
  type gate to the incoming `description` a few lines down, and `objectDef` is optional at
  that read, so a type gate would suppress nothing on exactly the boards whose object schema
  is thin or absent. That reading is now a red test, not a comment.
  
  Deleting the branch also deleted this path's read of `@object-ui/core`'s
  `EXPANDABLE_FIELD_TYPES`, so objectui#5874's identity pin for this face is re-anchored onto
  the read that is live — `buildExpandFields`, on every fetch — where the membership delta is
  observable on the wire (`$expand`) as well. That pairs the identity pin with the
  behavioural counter-probe #5874 had to record as missing.
- 7d2a689: `ObjectKanban` no longer queries twice on mount (objectui#6271). A standalone board issued
  its first `find` before the object definition resolved — so `buildExpandFields` saw no
  fields and that query carried no `$expand` at all — then issued a second, expanded one once
  the definition landed:
  
  ```
  ['deal', { $top: 100 }]
  ['deal', { $top: 100, $expand: ['owner'] }]
  ```
  
  The definition now GATES the query instead of refining it afterwards: one query per mount,
  carrying the expansion the first time.
  
  Decided on measurement rather than on the two shapes' relative appeal. The first response
  never reached the screen in the regimes that matter: with the schema resolving no slower
  than the row query (profiles schema/find = 30/30, 30/60, 5/30 ms), the definition lands
  first, the effect re-runs, its cleanup flips `isMounted` false, and the unexpanded rows are
  discarded on arrival — a DOM probe polling every 2ms for a title only that response carried
  never fired once. What the gate costs is one schema resolution ahead of the query, and that
  read is cheap and shared: one small GET behind the same discovery call `find` already
  awaits, served thereafter from `MetadataCache` (5-minute TTL, concurrent readers coalesced
  onto one request). Measured against the real `ObjectStackAdapter` over loopback HTTP, 22
  reads of one object produced exactly one metadata request and every read after the first
  returned in 0.01ms. End to end the board is not slower for it — same harness, before →
  after, time to the fully populated board: 156.9 → 145.2ms (30/30), 119.8 → 110.6ms (30/60),
  54.7 → 52.4ms (5/30).
  
  The gate is on the definition read having **settled**, not on the definition being truthy:
  an adapter that exposes no `getObjectSchema`, and a read that throws, both settle with
  nothing to report and the board falls through to an unexpanded query rather than waiting
  forever. Boards fed rows by a parent (`data`, `bind`, inline `schema.data`) are untouched —
  they never ran this effect, and they still read the definition for lane titles and labels.
  
  The `isOpaqueId` suppression in the card-description path is unchanged and keeps its
  comment beside it: part of what it hid was this fetch ordering, but unexpanded rows still
  reach it from parents that pass rows they fetched without `$expand`, from author-supplied
  data, and from backends that decline an expansion.
- 3beef6d: The spec's `dataSource` element binding is now DECLARED by the blocks that read
  it, so the html tier stops reporting the one working saved-view spelling as
  `unknown-prop` (objectui#6678).
  
  `PageComponentSchema.dataSource` — `{ object, view, filter, sort, limit }` — is
  the one spelling that resolves a saved view for an object-bound block. It works,
  and it drew the identical `unknown-prop` warning as the two spellings that do
  nothing (`viewName`, `view`), because `validateTree` looks a prop up in the
  block's declared `inputs` and no registration declared this key. On the tier
  built to accept AI-authored pages, where the diagnostic IS the contract, the
  only signal pointed away from the key that works.
  
  Adopting the maintainer ruling of 2026-08-29 — option B **in the injection
  form**:
  
  - `ELEMENT_DATA_SOURCE_INPUT` is the single declaration, in `@object-ui/core`
    beside the binding's own semantics; `Registry.register` emits it for any
    registration whose renderer passed through the new `elementDataSourceBlock()`
    seam. One mechanism, one copy — not a hand-kept declaration per block, which is
    the shape that drifts and that a new block forgets. The seam lives in
    `@object-ui/core` and is re-exported by `@object-ui/react` beside
    `ElementDataSourceGate` for discoverability; call sites take the core import,
    because a registration runs at module scope and this repo's suites partially
    mock `@object-ui/react`.
  - Seventeen renderers, in thirteen files across twelve packages, reach the seam
    and now publish the key to the save gate, the parser whitelist, the generated
    JSX authoring types and the block list. The card named nine blocks; the tree
    also has `plugin-grid`, `plugin-timeline`, two further `plugin-form` blocks and
    `element:record_picker` — nothing was hand-listed, so the mechanism covered
    them. `element:record_picker` consumes the gate's HOOK and status panels rather
    than the wrapper tag (its object lives under `properties`), and was found by a
    render probe rather than by reading sources.
  - `dataSource` on a block that does NOT read it (`flex`, `card`) still reports
    `unknown-prop`. Adding the key to `sdui-parser`'s `BASE_PROPS` was refused for
    exactly this reason — that set mirrors `BaseSchema`, and silencing the key
    everywhere would make the diagnostic lie in the other direction.
  - New `check:element-data-source-declaration` fails any source that consumes the
    gate without reaching the seam, so a block added tomorrow cannot forget.
  
  Behaviour of the binding itself is unchanged — this is a declaration, not a
  resolution change. The saved view still resolves its columns, and an
  unresolvable `view` still fails loudly rather than widening to the object's full
  scope.
  
  The spec/registry parity gates (repo-wide and the `record:related_list` per-block
  pin) now derive their accepted set from the WHOLE node contract rather than from
  `ComponentPropsMap[type]` alone. `PageComponentSchema` accepts and keeps
  `dataSource` on a page-component node — it is a node-level key, a sibling of
  `type` and `className`, not a per-block prop — so the gates' previous complaint
  was measurably wrong. Derived from the spec, not exempted, and both still
  discriminate against an invented key.
- f08bcd9: `FieldEditWidget` now delivers the NON-DOM half of the contract it declares (objectui#7008).
  
  objectui#7009 made the factory forward its declared DOM pass-through block. The rest of
  `FieldWidgetComponentProps` was still dropped: `error`, `onUploadingChange`, and the whole
  "Host plumbing" block (`dataSource`, `dependentValues`, `dependsOn`, `dependsOnLabels`,
  `emptyHint`, `onSelectRecord`, `onCreateNew`). A host could pass any of them with no type
  error and the widget never received it — the "declared but not delivered" class this
  package treats as first-class.
  
  `error` was the live one. `InlineFieldInput` has passed `error` into this factory since
  PR #7109 and the factory dropped it, so an inline-edit control that had failed validation
  never reported `aria-invalid`: a sighted user saw the red hint, a screen-reader user was
  told nothing. The kanban `RequiredFieldsDialog` had the same hole from the other side — it
  computes the validation state and could not hand it over — and now passes `error`, so its
  controls are marked. Delivering `error` buys the a11y MARKING only; the message text stays
  with the host, per the objectui#3222 contract.
  
  The keys travel through a new sibling executor, `toHostProps` (exported alongside
  `toDomProps`), never through the DOM whitelist — none of them is DOM-legal, and routing a
  `dataSource` adapter there is the `[object Object]` leak that whitelist exists to stop.
  Three compile-time assertions make the two executors partition the contract, so a future
  declared key cannot go undelivered silently.
  
  `dataSource` precedence is stated rather than left to emerge: a host's explicit
  `dataSource` prop WINS over `SchemaRendererContext`. That is the order `LookupField`
  already implements; the factory is a conduit and resolves nothing. A host that passes no
  `dataSource` keeps reading the context exactly as before, so no in-repo host changes
  behaviour.
- 7c3df8f: The settled-schema convergence, and the gantt's duplicate query gated
  (objectui#7225, maintainer ruling B, 2026-09-02).
  
  `useSettledSchema` was extracted and published in PR #6690 with exactly **one**
  non-test adopter (`ObjectTree`, the component that had an actual defect —
  objectui#6481's unkeyed latch). `ObjectKanban`, `plugin-view/ObjectView` and
  `ObjectCalendar` kept their own hand copies of the same shape, so a published
  export was owed compatibility forever **and** the duplication it was named for
  stayed. All three now call the hook.
  
  The migration is a pure deduplication with no behaviour delta — the hook was
  extracted *from* these three shapes, so each becomes a one-line call.
  `ObjectCalendar`, which objectui#6482 named as the obstacle, fits via the
  recipe the hook's own doc comment prescribes for it by name: pass the data
  source as `undefined` for a render that must not read metadata
  (`hasInlineData ? undefined : dataSource`), so "inline value data set" is
  expressed as "there is no source to read from" rather than as a second enable
  flag. GATE PLACEMENT stays local in all three, which is what #6482 ruled and
  what made the calendar's obstacle a non-obstacle: it was about the gate half.
  
  **One observable change:** `ObjectKanban`'s rejected definition read now logs
  on `console.error` with a `[useSettledSchema]` prefix instead of
  `console.warn`. Its test spy moves with it, and now asserts on the channel
  rather than merely silencing it.
  
  **The gantt's duplicate query is gated** (ask 2 of the card; #6482's
  undischarged half). `ObjectGantt` listed `objectSchema` in `reload`'s
  dependency list, so every load issued two unbounded queries — the first with no
  `$expand` at all. Measured on this component across three latency profiles, the
  cost is not the mild "round trip bought and thrown away": when the metadata
  read is the slower of the two, which is the common case on a cold
  `MetadataCache`, the user sees the full three-step paint — raw foreign-key ids,
  back to the loading placeholder, then the expanded rows. It now issues one
  query, already expanded.
  
  Gating the gantt required its schema resolution to settle on EVERY exit
  (objectui#7232): the hand-rolled effect returned without settling on
  `!effectiveDataSource`, on `!resource` and in its `catch` — harmless while
  nothing waited on it, and a chart that never loads once something does.
  `useSettledSchema` settles on all three by construction, which is what makes
  the gate safe; both exits are pinned.
  
  ⛔ Gating is not capping. The row ceiling on these fetches is objectui#7210's
  separate ruling, in its own commit on the same branch.
- c4f775a: Keep the kanban column-header row visible when swimlanes are on (objectui#7303).
  
  Turning swimlanes on for a board — `grouping.fields[0].field`, which is the only
  authorable route, since `KanbanConfigSchema` is strict and rejects
  `kanban.swimlaneField` — removed the status column titles from the screen. They
  stayed in the DOM, at the right coordinates, painting nothing, so the board read
  as an unordered card wall: the lane told you the caliber of the work and nothing
  told you its state.
  
  The cause is a flexbox rule rather than a paint bug. The header row is a flex
  item of the swimlane region (a `flex-col` inside a height-bounded board), and its
  `overflow-x-auto` makes it a scroll container — which zeroes a flex item's
  automatic minimum size, so it may legally be shrunk to height 0. The lanes below
  keep `overflow: visible`, so their own automatic minimum size clamps them at
  content height and they refuse to shrink; the moment the lanes overflowed the
  board, the entire deficit landed on the one shrinkable item. The row now carries
  `shrink-0`, which takes it out of that pool.
  
  Note the trigger, because it decides who saw this: the collapse needed the lanes
  to OVERFLOW the board's bounded height. A board short enough to fit rendered its
  titles normally, which is why this presented in the field as "sometimes the
  column labels are missing" rather than as a flat breakage of swimlanes.
  
  Measured in Chromium 1194 at 1600×1000 on the component's own rendered markup:
  header row height 0 → 24, header cell 0 → 24, and `elementFromPoint` at a title's
  own centre returning the lane-collapse button before the fix and the title itself
  after it. Nothing else about the layout moves — the row keeps its `pl-36 sm:pl-44`
  alignment with the lane content rows, and the non-swimlane board is untouched.
- d327b9c: FLS-gate the `$expand` projection at the seven remaining `buildExpandFields`
  call sites (objectui#7429).
  
  objectui#7215 / PR #7229 gated the two projection sites in its scope
  (`ObjectGrid`, `ListView`). objectui#7230 / PR #7428 gated four more
  (`ObjectCalendar`, `ObjectGantt`, `RecordDetailView`, `DetailView`). This
  closes the seven that were left: `ObjectKanban`, `ObjectTree`, `ObjectView`
  (the non-grid record-fetch effect), `ObjectMap`, `ObjectGallery`,
  `ObjectTimeline`, and the metadata-admin `PagePreview`'s record-binding fetch.
  
  **All seven pass no column list at all**, which makes every one of them the
  sharp shape: `buildExpandFields` reads an absent column list as "no column
  restriction" and falls back to **every declared relation on the object**,
  denied ones included. So each of these components asked the server to resolve
  the object's full relation set by default, not by configuration — the
  ordinary shape of each surface, not a corner of it.
  
  **`PagePreview` is the one site where the judged principal is not the page's
  eventual audience.** It calls the browser's own `fetch` with
  `credentials: 'include'` rather than `DataSource.find`, so it runs under
  whichever session is loading the Studio preview. Gating on that same session's
  `usePermissions()` is still the correct principal: it is exactly the request
  the browser is about to make, on its own credentials, regardless of who later
  opens the published page.
  
  **Reproduced before it was fixed**, as a failing test per site (and, for the
  two sites — `ObjectView`, `PagePreview` — where the gate was implemented
  before its test was run red, a reverse-verification: the gate was reverted,
  all four denial-and-set pins on each went red, and the two deferral/positive
  control pins stayed green, before the gate was restored).
  
  **Grading, measured rather than assumed** — the same reading objectui#6898,
  #7215 and #7230 recorded: against ObjectStack's own server this is
  defence-in-depth, not a live disclosure. `plugin-security`'s
  `FieldMasker.maskRecord` deletes every unreadable key from each returned row
  and objectql's expand path writes the resolved record back under that same
  key, so one statement removes the expanded object and the bare id alike; the
  expansion sub-read is itself gated (the referenced object's full CRUD + RLS +
  FLS treatment, objectstack#7626). It is load-bearing for any backend that does
  not strip, and the client-request side is real regardless.
  
  **Nothing a permitted view did stops working.** The gate judges each site's
  `buildExpandFields` OUTPUT, which contains only the object's declared
  reference-bearing fields, so the "`checkField` answers false for an
  undeclared key" trap cannot be reached. An unanswered permission policy
  filters nothing. `buildExpandFields` itself is unchanged.
  
  `@object-ui/permissions` is added to `dependencies` for `plugin-kanban`,
  `plugin-tree`, `plugin-map`, `plugin-timeline`, and `plugin-view` — the fifth
  one objectui#7429's own dependency count missed (it named four); `plugin-list`
  and `app-shell` already had it.
- c6198c2: **Breaking for authored metadata:** `ComponentInput.label`, `ComponentInput.defaultValue` and
  `ComponentInput.advanced` are RETIRED on both faces (objectui#7493 item ① and objectui#7781;
  maintainer ruling A of 2026-09-06, immediate, no deprecation window; ADR-0049 enforce-or-remove).
  They are the three keys the manifest serializer does not forward, and nothing read them on any
  publication or consumption path.
  
  No manifest ever published them, so no consumer could ever have read them. `sdui-parser`'s
  serializer (`packages/sdui-parser/src/index.ts`) forwards exactly six keys per input — `name`,
  `type`, `required`, `enum`, `binding`, `description` — so a value authored under any of the three
  never reached `sdui.manifest.json`, the generated JSX `.d.ts`, or a diagnostic; its boundary type
  has no slot for them; the registry's data-source seam reads `name` only; and neither the designer
  nor the app-shell inspectors consult registry `inputs` at all. A structural census over every
  `inputs:` array in the repository (re-measured on this change's merge-base, `name` 951 and `type`
  951 as the controls) counted the writes: `label` 908, `defaultValue` 245, `advanced` 9 — written on
  nearly every registration, read by nothing.
  
  FROM → TO, per key — all three **TOMBSTONED, not removed**, because the route was measured on
  the built face before it was chosen: `ComponentInputSchema` is a non-strict `z.object`, and an
  undeclared key parses GREEN and is silently STRIPPED, so a deletion would have swallowed 1,162
  authored values in silence. The tombstone is what makes the refusal loud and by name.
  
  - `label?: string` → `label?: never` on the interface, `retirementTombstone()` on the Zod mirror.
    Migration: delete the key. An input is identified by its `name` on every path that reaches it;
    nothing ever rendered a label for it.
  - `defaultValue?: any` → `defaultValue?: never` / `retirementTombstone()`. Migration: delete the
    key. The renderer's own fallback read IS the default; tell the author about it in `description`,
    which IS published. (Tightening the type to `unknown` was ruled out: it closes no error class,
    since nothing reads the value.)
  - `advanced?: boolean` → `advanced?: never` / `retirementTombstone()`. Migration: delete the key.
    No designer surface ever hid an "advanced" input; there is nothing to write instead.
  
  The retirement kit: `?: never` on `ComponentInput` (`packages/types/src/base.ts`), so authoring one
  is a `tsc` error at the registration site; `retirementTombstone()` on `ComponentInputSchema`
  (`packages/types/src/zod/base.zod.ts`), so an authored value is REFUSED at parse time with
  `code: 'invalid_type'`, the key named in the issue `path`, and the migration note as the message
  (one string, both channels). Pinned in
  `packages/types/src/__tests__/component-input-retired-keys-7493.test.ts`, which also holds a
  tree-scoped absence census over every `inputs:` array under `packages/**` and `apps/**`.
  
  Accept-set change, stated plainly for reviewers: a document that sets any of the three keys on a
  `ComponentInput` used to parse GREEN (the value was then dropped by the serializer) and now parses
  RED. Every in-repo authoring site — 1,199 keys across 110 registration files, the three standalone
  `ComponentInput[]` arrays and the two named input arrays `tsc` found included — is deleted in the same change, as the ruling's split rule
  requires; the `WidgetRegistry` seam no longer copies the widget-manifest values onto the synthesized
  `ComponentInput` (they fed nothing), and the data-source declaration `ELEMENT_DATA_SOURCE_INPUT`
  drops its `label`. The patch entries on the other packages record exactly that: their registrations
  stop authoring inert keys, with no runtime or published-manifest change.
  
  The nine test files that read `defaultValue` off a registration were re-pinned against the
  renderer's ACTUAL default (its own fallback read, or the `defaultProps` it ships) instead of the
  declaration that went away; two assertions that only restated the shadow default were dropped with
  the reason on the line.
  
  The in-repo zero is what was measured. Whether anything OUTSIDE this repository writes these keys
  is not measurable from here (the objectui#5674 limit); converting such a write from a silent drop
  into a named refusal is exactly what the tombstones buy. `WidgetInput`'s own `label` /
  `defaultValue` / `advanced` (the widget-manifest face) stay declared and writable — nothing has
  ruled on that face; that it now has no reader either is recorded as objectui#7911.
- 2af1fa7: `KanbanSchema` / `KanbanColumn` / `KanbanCard` / `CardTemplate` /
  `ColumnWidthConfig` are now the `@object-ui/types` declarations, re-exported
  from this package rather than declared in it (objectui#7664, maintainer ruling
  (a)). Nothing this package renders changed and every existing import keeps
  resolving; what changed is that `safeValidateSchema` in `@object-ui/types` now
  validates an authored `type: 'kanban'` document against this very shape, so a
  board that validates is a board these renderers draw.
  
  **The shape is not member-for-member what this package declared — it is that
  shape plus four members**, counted off `origin/main`'s
  `plugin-kanban/src/types.ts` (19 members on `KanbanSchema`, 6 on
  `KanbanColumn`, 7 on `KanbanCard`) against the `@object-ui/types`
  declarations:
  
  - **`onCardClick` is DECLARED for the first time.** This package's dialect
    never had the member, while `KanbanRenderer` has always forwarded
    `onCardClick={schema.onCardClick}` — an undeclared read (objectui#7742). It
    is declared here as a `#6124` RUNTIME SLOT: callable on the TypeScript face,
    refused by name on the mirror, like the `onCardMove` and `onQuickAdd` beside
    it in the same forward block.
  - **Four `?: never` tombstones** carry the retired declarative face's keys
    under the same `'kanban'` key so those spellings keep being refused by name:
    `draggable`, `onColumnAdd` and `onCardAdd` on `KanbanSchema`, and `color` on
    `KanbanColumn`. None of the four was ever a member of this package's dialect;
    each is refused, not silently accepted, because the retired face taught it.
    The full accept-set statement is on the sibling `@object-ui/types` entry.
- 2d80456: `object-kanban` / `view:kanban` and `object-calendar` / `view:calendar` now DECLARE seven
  spec-carried keys their renderers already honoured, so the html tier stops reporting working
  metadata as `unknown-prop` (objectui#8201, the backlog objectui#8176 exposed).
  
  Board: `groupBy`, `cardTitle`, `titleField`, `swimlaneField`, `coverImageField`.
  Calendar: `defaultView` (the spec's three-member enum) and `locale`.
  
  No renderer behaviour changes — every one of these keys was already read and already acted on;
  what changes is that authoring tools can now discover them and the save gate agrees with the
  validator. Both tags of each block now spread ONE shared `inputs` list, so the two published
  surfaces cannot drift apart by hand-copy.
- 5591f03: A Kanban lane header over a windowed fetch now says `77+` instead of `77`
  (objectui#8307).
  
  **The defect.** `object-kanban` fetches with a real `$top` (objectui#4025) and then
  groups **what came back** into lanes client-side, so `col.cards.length` counts fetched
  rows that fell into this lane — not the size of the group. Over any object holding more
  rows than the window every lane number is wrong and they sum to the window. Measured in
  a consuming app on 200 records: the board displayed **77 · 19 · 2** against a true
  **88 · 46 · 28 · 14 · 9 · 15**.
  
  The expensive part is that those numbers look right. 77 · 19 · 2 is a plausible funnel;
  there was no ellipsis, no "100 of 200", no styling difference — nothing prompting the
  reader to distrust a number that then travels into a status report.
  
  **The fix is not a better number, it is an honest one.** This component does not have a
  group total and cannot compute one: that needs a server-side group-count aggregate over
  the whole filtered set, which is a separate change. What it can stop doing is claiming a
  total it never fetched. When the fetch comes back **saturated** — at least as many rows
  as the window allowed — every lane header on the board renders `77+`, which is precisely
  what a count over a window establishes: *at least* 77. A fetch that came back short of
  its window is the one case where the client knows the result set was exhausted, and
  there the bare number is the truth and is kept. Rows handed to the board whole (inline,
  bound or external `data`) never passed through this window and keep the bare number too.
  
  `DEFAULT_KANBAN_LIMIT` is unchanged, deliberately: raising it moves the threshold
  without touching the property, and every board above the new number would fail exactly
  as silently.
  
  **The boundary case is resolved towards the true statement.** A board holding exactly
  the window is indistinguishable from a truncated one from the client side — both answer
  a `$top: N` query with N rows — so such a board renders `77+` for a lane that really
  holds 77. "At least 77" is TRUE there, whereas the bare "77" is FALSE on every truncated
  board. The marker is conservative; it is never wrong.
  
  All three lane headers move together — the flat column header and the swimlane layout's
  column-title row and lane rows — through one `laneCountLabel` helper, so a board cannot
  be honest in one layout and silently wrong in the other. Pinned by
  `laneCountHonesty-8307.test.tsx`, which reads the rendered header text (a threaded flag
  dropped one render short of the DOM would ship the identical silent board) and carries
  the exactly-at-the-window row and both negative controls.
- 4fa0eb9: A kanban board now answers its `cardTitle` / `titleField` choice ONE way on every surface
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
- 8a4a106: `object-kanban` / `view:kanban` now DECLARE the four array/object-armed spec keys the board
  already honoured — `data`, `cardFields`, `grouping` and `conditionalFormatting` — so the html
  tier stops reporting working metadata as `unknown-prop` (objectui#8313, slice 2a of
  objectui#8201).
  
  No renderer behaviour changes: every one of the four was already read and already acted on.
  What changes is that authoring tools can discover them, and that each declared description now
  states exactly HOW MUCH of the key this board honours — `grouping` only at
  `grouping.fields[0].field` and only as the fallback for `swimlaneField`, `cardFields` as bare
  field names rather than entry objects, `data` as a fetch suppressor as well as a value — so a
  declaration cannot recommend a write the renderer would drop.
- 18b6a75: Kanban cards: key the title-dedupe skip set off the shared name-field resolver
  
  A kanban card printed its record title twice — once as the card heading, once as
  the first row of the card body. `ObjectKanban` resolves each heading through
  ADR-0079's `getRecordDisplayName`, then builds a skip set so the title field's
  raw value is not rendered again as a card field. That skip set read
  `objectDef.NAME_FIELD_KEY`, a key nothing produces: `@objectstack/spec@17`'s
  object schema declares `nameField` (canonical) and `displayNameField` (its
  deprecated alias), and `NAME_FIELD_KEY` occurs nowhere in the framework tree —
  this repo reads it only as the last rung of the compatibility ladder inside
  `record-title.ts`, and never emits it.
  
  So the read was always `undefined` and the skip set collapsed to its five
  hard-coded literals (`name` / `full_name` / `title` / `subject` /
  `display_name`). Any object whose name field is spelled otherwise duplicated its
  title, which made the defect universal on AI-built apps — their objects name
  fields `visit_title`, `owner_name`, `<entity>_name` — and invisible on
  hand-built objects whose name field is literally `name`.
  
  The skip set now reads `@object-ui/core`'s `resolveNameField`, the name-space
  twin of the resolver that produced the heading, so the two agree on which field
  titles the object: declared `nameField` / `displayNameField` / `NAME_FIELD_KEY`,
  otherwise the type-aware derivation.
  
  Deliberately one rung, unlike the same dedupe in `record-details.tsx`, which
  also carries `deriveTitleField`: that ladder filters a synthesized field list,
  whereas this one filters an author-declared `cardFields`, where dropping a field
  the author asked for is a worse failure than a repeated title. A regression test
  pins both directions, including an object whose declared and derived pointers
  disagree.
- b6d07df: A horizontally scrolled swimlane Kanban board now keeps every column title over its own
  column (objectui#8448).
  
  **The defect.** The swimlane layout paints its column titles once, in a row above every
  lane, and then paints each lane's cells in a row of its own. Both rows were
  `overflow-x-auto`, so they were **independent scroll containers**: scrolling a lane
  sideways moved that lane and nothing else. Measured in Chromium at 1600x1000 with five
  columns, driving one lane to `scrollLeft: 298` left the header row at `0` — the `Open`
  title at x=200 above an Open lane cell at x=-97. The row overflows at ordinary widths
  there (`scrollWidth` 1840 against `clientWidth` 1552), so this was not an edge case at
  narrow viewports.
  
  Nothing errored. The board simply reported the wrong status for every card on screen,
  which is worse than the height-0 header row objectui#7303 fixed: that one failed loudly,
  this one reads as a working board.
  
  **The fix is one horizontal axis for the whole board.** The header row and every lane row
  now share a single scroll position: scrolling any of them scrolls all of them, in either
  direction, and a lane expanded after the board was already scrolled joins the axis where
  the board is rather than at 0. The two rows already carry the same left indent and the
  same column widths (objectui#7303, objectui#8508), so an equal scroll position *is* the
  alignment.
  
  Per-lane independent horizontal scrolling is gone. Nothing asked for it: no prop, no
  authorable schema key, no stored view setting and no test in this package held two lanes
  at different positions — the package's only other `scrollLeft` reader is the flat
  layout's mobile column indicator, which is untouched and stays off this axis.
  
  Nothing about the board's vertical arrangement changed — no `overflow-y`, no height
  bound, no sticky positioning — and the header row remains a scroll container that is not
  shrinkable, the invariant objectui#7303 pinned.
- f3ee584: fix(plugin-kanban): make swimlanes below the fold reachable
  
  A swimlane board's lane region was `overflow-hidden` while being shrunk to the
  board's bounded height, so any lane past the first screenful could not be
  reached by any gesture — the region had no scroll affordance and the document
  did not scroll either (measured in Chromium at 1600x1000: region `scrollHeight`
  2104 against `clientHeight` 1000, two of three lanes lost).
  
  The region now owns a vertical scroll (`overflow-y: auto`) and the column-header
  row sticks to the top of it, so the column titles stay visible over their own
  columns while you scroll through the lanes. The board stays height-bounded and
  self-contained; nothing about its horizontal axis changes.
- abc1b18: Add `isEmptyValue` to `@object-ui/core` — the weakest common claim about "is
  this value empty": `null`, `undefined`, the empty string, the empty array, and
  never a fifth member (objectui#8496, director seat, decision batch #86).
  
  Five surfaces had each grown their own copy of those four members, and
  objectui#8481 was the third rediscovery of the same hole. They now call the
  shared floor and state their own answer against it: `record:details`'
  `hasCellValue` and `RelatedList` extend it with a trim, `BooleanCellRenderer`
  with every non-boolean, the date cells with every falsy scalar; `JsonCellRenderer`
  declines its `[]` member out loud (the array literal is drawn on purpose) and
  `FileCellRenderer` states "0 files" instead.
  
  Two visible fixes come with it: a gallery card and a kanban card holding an
  empty array in a card field now OMIT that field, as they already did for `null`,
  instead of drawing a labelled "No value" em-dash for it.
- 154fe2a: Container-aware Kanban column sizing now reaches the swimlane layout, not just the
  flat one (objectui#8508).
  
  `KanbanBoardInner` derives a column width from the board's own slot
  (`useResizeObserver` on the wrapper that encloses both layouts) so an embedded board —
  in a panel, a drawer, a pop-out window — sizes to its slot instead of the viewport. The
  docblock over that computation said it "replaces hard-coded `w-[85vw] sm:w-80`", and it
  had exactly one consumer: `KanbanColumnView`, on the flat path. The swimlane layout
  paints plain column cells itself and has no column components to inherit from, so both
  its header cells and its lane cells kept the viewport-relative classes. The sentence was
  true of one of the two layouts, and a swimlane board embedded in a narrow slot — exactly
  the case the feature exists for — was still sized to the viewport.
  
  Both layouts now take their width from one shared `columnWidthClasses(columnStyle)`
  helper plus the same `columnInlineStyle` object, so a container width steps the viewport
  classes aside on either path and its absence (SSR, or before the first observation)
  falls back to them on either path. Nothing about the flat layout's rendered width
  changes; the swimlane header row and its lane rows move together, which is what keeps
  the titles over their columns.
  
  Pinned by `swimlaneContainerAwareColumnWidth-8508.test.tsx`, which reads the inline
  style rather than a rendered dimension — happy-dom performs no layout — and asserts a
  real positive width at each width tier on both layouts, so deleting the viewport classes
  without wiring a width cannot pass.
- 8600557: Kanban: a `columns` prop update now reaches the DOM in the same commit
  (objectui#8534).
  
  `KanbanImpl` mirrors its `columns` prop into `boardColumns` state. That mirror
  was re-synced by a passive `useEffect`, and passive effects run *after* the
  commit — so every prop-driven column change was painted one commit late. A board
  whose data resolved after mount rendered a frame of column headers with empty
  card lists before a second commit filled them in, and any card cell derived from
  data that arrived with the newer prop generation (a field's declared label, for
  one) rendered from the older generation for that frame.
  
  The mirror **stays**. Deriving `boardColumns` from the prop is not available:
  the drag path writes it optimistically and the prop never carries card *order*
  back — a same-column reorder calls no callback at all, and `ObjectKanban`'s
  `handleCardMove` early-returns on `fromColumnId === toColumnId` and discards
  `newIndex`. Order truth is local, so a derived board would roll a committed
  reorder back on the next prop change. What changed is only *when* the mirror is
  aligned: during render (React's documented "adjusting state when a prop changes"
  pattern) instead of in an effect. The reset trigger is byte-identical to the
  effect's — `safeColumns` identity — so the rejected-move rollback of
  objectui#4138 still fires exactly as before, and optimistic reordering is
  unaffected.
  
  ⚠️ This closes **one** of the two first-frame races on this board. The other —
  `KanbanRenderer`'s `React.lazy` chunk load racing the data commit — is untouched
  and still open.
- 326a6e5: Fix swimlane column titles sliding 9px off their columns at the right end of the board
  
  A swimlane board scrolls on one horizontal axis: a scroll handler copies
  `scrollLeft` from whichever row the user drove onto every other row. Equal
  `scrollLeft` is equal alignment only while the rows have the same scrollable
  range, and they did not — the lane content rows carried `px-2` that the
  column-header row did not, making their maximum `scrollLeft` larger. Scrolled
  fully right, the header row clamped at its own smaller maximum and every column
  title sat 9px off its column until the user scrolled back.
  
  The column-header row and the lane content rows now take their horizontal
  padding from one shared constant, so the two ranges cannot drift apart. Measured
  in Chromium at 1600x1000: the worst title/cell offset across the whole range,
  including the extreme right, drops from 9px to the 1px lane-border baseline.
  Card layout inside the lanes is unchanged.
- de1a126: The kanban board no longer announces "No cards" before it has the records
  (objectui#8827).
  
  `KanbanImpl` paints `DataEmptyState` — a `role="status" aria-live="polite"`
  live region titled **No cards** — whenever the board holds zero cards across
  more than one lane. That predicate is an assertion *about the data*, and the
  component was making it before it had the data.
  
  `KanbanRenderer` loads `KanbanImpl` behind `React.lazy`, so the chunk's arrival
  and the records' arrival are two unordered events (this is objectui#8534's
  second half; the mirror half was closed by PR #8825 and is not this). On the
  production shape — lanes derived synchronously from `schema.columns`, rows
  arriving from `ObjectKanban`'s query — the two orderings were measured on
  post-#8825 `main` and they diverge. When the data wins, the Suspense skeleton
  covers the whole window and nothing is announced. **When the chunk wins,
  `KanbanImpl`'s first committed frame carries the authored lanes with zero cards
  and announces a false "No cards" to assistive technology while the rows are
  still in flight.** The only thing hiding it was the lazy skeleton happening to
  be slower than the fetch, and nothing makes it slower.
  
  ## What changed
  
  The empty-state predicate now hangs on **settled**, not on "zero rows".
  `ObjectKanban` derives whether the records it is drawing have settled and hands
  that to `KanbanImpl` through a **package-private context** — not a member of
  the published `KanbanRendererProps`, and emphatically not a member of its
  `schema` bag, which `BaseSchema`'s passthrough would make reachable by an
  author (the shape objectui#7742 / decision batch #70 moved `objectFields` off).
  Nothing here reaches the published surface.
  
  The signal is a **keyed resolution**, not a boolean, following
  `useSettledSchema`'s shape for the same reason it has that shape (objectui#6271
  / #7225): a bare boolean takes the same value for "not started" and
  "finished". `ObjectKanban`'s existing `loading` state is exactly that boolean —
  in standalone mode it initialises `false` and is only set `true` inside the
  fetch effect, so the first frame still reads `loading === false` and wiring it
  into the predicate would have fixed nothing.
  
  The per-lane `kanban.noCards` placeholder takes the same gate. It renders the
  same string, and on a single-lane board the board-level predicate never
  runs — so gating only the live region would have left the false claim alive on
  exactly the boards the live region never covered.
  
  ## What did NOT change
  
  **A genuinely empty board still paints `DataEmptyState`.** The reverse
  regression — "gating on a truthy definition would leave those boards empty
  forever", named in `ObjectKanban.tsx` itself — is what the settle contract
  exists to prevent, and every exit settles: the query succeeding, the query
  throwing, no readable source, the non-fetch record sources (external, bound and
  inline data are settled from the first frame), and the schema-only `kanban-ui`
  entry, which has no `ObjectKanban` and therefore no provider and so takes the
  context's **settled** default. Lanes, headers, counts and drop targets keep
  rendering while the rows are in flight; only the claim is withheld.
  
  No chunk boundary moved, no bundle changed, and no first paint was delayed —
  ordering the chunk against the data (which would trade first-paint time for
  first-frame correctness) remains open on objectui#8827 and is not done here.
- 7db4a81: Fix `bucketCardsIntoColumns` double-bucketing every record on a board whose lane
  ids are not strings (objectui#8993).
  
  The function decided lane membership **twice**, with two key types:
  
  - **injection** reads `groups[col.id]`, and a property read coerces its key — a
    lane `{ id: 1 }` correctly picks up the group stored under `'1'`;
  - **the leftover sweep** (objectui#2792) built its known-id `Set` from the RAW
    `col.id` and filtered `Object.keys(groups)`, which are always strings. Since
    `new Set([1]).has('1')` is `false`, every record the injection had just placed
    was swept a second time into the trailing "Uncategorized" lane.
  
  ⇒ A numeric-id board rendered **every card twice**. Silent by nature: the board
  draws, only the totals fail to reconcile.
  
  The repair is on the sweep side — the set now holds the same key spelling the
  property read uses, so both decisions agree. ⛔ Not on the injection side:
  making that read strict would break the coercion lanes depend on, and the string
  control could not catch it. A symbol id is the one key a property read does not
  stringify, so it is kept as-is rather than pushed through `String()`, which
  throws on symbols; `Object.keys` never yields a symbol, so such a lane keeps the
  reading it has today.
  
  **Visible change.** A board whose metadata already hits this — a picklist whose
  option `value` is a number, which reaches the renderer as a lane id through a
  path no schema guards — showed each card twice, once in its lane and once in
  "Uncategorized". It now shows each card once. The trailing lane still collects
  records whose group value matches no lane, which is objectui#2792's job and is
  pinned alongside the repair.
  
  `@object-ui/types` carries prose only: the lane-id `describe()` and TSDoc that
  stated the double-render as current behaviour now state it as repaired. The
  authored `id` stays `string` — one declared lane-id type beats two.
- 1e0e46a: Fix the Kanban bucketer throwing (and mis-bucketing) when a record's `groupBy` value
  is a member name of `Object.prototype` (objectui#9043).
  
  `bucketCardsIntoColumns` built its label-to-lane map and its grouping accumulator as
  prototype-bearing object literals and then keyed both from **record data**, which no
  schema guards — `@objectstack/spec` narrows the lane `id` (objectui#8913), not the
  values stored in the grouped field. A stored value of `'toString'`, `'valueOf'` or
  `'hasOwnProperty'` therefore hit the inherited METHOD in the accumulator: it is truthy,
  so the array was never created and `.push` was called on a function, thrown during
  render — the user saw a blank board or an error boundary with nothing naming the
  offending record. `'constructor'` and `'__proto__'` took the other branch (they survive
  the `.toLowerCase()` on the label-map read) and were grouped under the stringified
  inherited member instead of their own value. A lane legitimately declared with one of
  these option values was worse still: writing `labelToColumnId['__proto__']` invoked the
  `__proto__` setter and was silently ignored, and the injection read `groups[col.id]`
  answered `Object.prototype`, which spreads as "not iterable".
  
  Both maps are now created with `Object.create(null)`, so every key is answered by what
  the function stored. A `hasOwnProperty` guard was not used: it closes the reads only,
  and the `'__proto__'` hazard is on the writes.
  
  Records that match no lane keep today's behaviour — they surface in the trailing
  "Uncategorized" lane (objectui#2792), never discarded. Bucketing for ordinary values is
  unchanged.
- 3dd533f: The kanban board's "No cards" announcement no longer depends on how many lanes
  it has (objectui#9045).
  
  `KanbanImpl` derived its board-level empty state from
  `totalCardCount === 0 && boardColumns.length > 1`. The second conjunct is a
  **lane count**, and it made the announcement unreachable on two shapes:
  
  - a **zero-lane** board — no lanes at all, so nothing on screen said anything;
  - a **one-lane** board — the board-level live region never painted, and the only
    "No cards" string was the lane's own dashed placeholder: a plain `span` with
    no `role` and no `aria-live`.
  
  `DataEmptyState` is the board's only `role="status" aria-live="polite"` region,
  so on both shapes a screen-reader user was told nothing at all.
  
  ## Why now
  
  A lane-less `object-kanban` document could not pass validation until
  objectui#9021 made `ObjectKanbanSchema.groupBy` optional, as the protocol
  declares it. A schema-valid `{ type: 'object-kanban', objectName }` now reaches
  a board with no lane key — zero cards, and a silent blank. The predicate is
  older than that card and **this is not a defect #9021 introduced**; the widening
  is what made it reachable.
  
  ## What changed
  
  The predicate asks whether there are any **cards**:
  `totalCardCount === 0`. Nothing else moved — no exported symbol, no schema, no
  published payload.
  
  ⚠️ One consequence did land in the same pull request, and it has its own
  changeset beside this one: making the region paint at one lane made the
  description's `"1 columns"` reachable, so objectui#9170 removes the lane count
  from that description. That change edits no locale pack either, so the sentence
  above still holds for both halves.
  
  ## ⚠️ The lane count was not guarding the loading state
  
  The plausible reading — that `> 1` separated "still loading" from "genuinely
  empty", since a board mid-flight can look lane-less — was measured, not assumed.
  It is wrong: that distinction is carried by a **separate** conjunct,
  `recordsSettled` (objectui#8827), which this change does not touch. A zero-lane
  and a one-lane board are each driven with their query held in flight and
  announce nothing, then announce once it settles with no rows.
  
  ## What a one-lane board now renders
  
  Exactly what a multi-lane empty board has always rendered: the board-level live
  region, and no per-lane placeholder. `suppressEmptyPlaceholder` is unchanged —
  its stated reason is that the board-level state is already saying it, so a
  per-lane copy would be a duplicate, and on a one-lane empty board that reason is
  now **true** where it used to be vacuous. The board-level region is a live
  region and the placeholder never was, so the visible affordance moves up one
  level while the announcement is gained.
  
  ## What did not change
  
  A multi-lane board **with** cards still announces nothing, and a multi-lane
  board with **no** cards still announces — both were already correct and both are
  pinned as non-regressions, not as evidence of this fix. Nothing may announce
  while the records are in flight, on any lane count.
- 3dd533f: The kanban board's "No cards" announcement drops the lane count from its
  description (objectui#9170).
  
  The board-level empty state composed its description by **concatenation**: the
  lane count, a space, then the pack's `kanban.columns` unit word, a bare plural
  with no singular form. Read from the live region's own `textContent`, a one-lane
  board announced `"No cards1 columns"` — and `DataEmptyState` there is
  `role="status" aria-live="polite"`, so this is read aloud.
  
  ## Why the old string was correct until it wasn't
  
  The bare plural was not a latent bug. The empty state used to require
  `boardColumns.length > 1`, so the count in front of `columns` could never be 1
  and the plural always agreed with it. objectui#9045 made the region paint at zero
  and one lane — that widening **is** the accessibility fix — and the one-lane form
  became reachable with it.
  
  ## What changed
  
  The description is gone. The live region announces the title only, at every lane
  count: zero, one and two lanes all read exactly `"No cards"`. The lane count is
  already visible on the board, and read aloud it is noise; the region's job is to
  say that the board holds no cards.
  
  ⭐ That also makes the bare plural safe **by construction** rather than by a
  predicate: there is no number in this region for a plural to have to agree with,
  in any language. The alternative considered — a plural family for
  `kanban.columns` across ten locale packs — was ruled against.
  
  ## What did **not** change
  
  - objectui#9045's predicate is untouched: a zero-lane and a one-lane board still
    announce. Route 3 removes the number, never the announcement, and that is
    pinned as its own case rather than assumed.
  - **No published payload moved.** No locale pack was edited, no key was added,
    renamed or retired. `kanban.columns` stays in all ten packs exactly as it was;
    it now has no call site, and `scripts/check-i18n-dead-keys.mjs` — report-only
    by design — is what judges its fate, in its own time and not here.
  - The provider-less path needs no separate repair for once: a region with no
    number needs no plural logic, and `createSafeTranslation`'s fallback has none.
- f20a111: fix(plugin-kanban): the board stops showing a card order it persists nowhere
  
  Dragging a card **within its own column** used to reorder the board on the spot.
  Nothing recorded that order — the same-column branch notified no one, the mover
  returns early when the source and target columns are equal, and the write body
  carries the grouped field and no positional key — so the next data round-trip
  (a refetch, a poll, any reflow from the host) silently put the card back. The
  user performed an action, watched it succeed, and then watched it disappear with
  no error, no toast and no rollback animation.
  
  A card dropped inside its own column now returns to its position. On a
  cross-column move the column change still happens and is still persisted; the
  landing **position** is no longer claimed — the card lands where the data order
  puts it rather than in the slot it was released over, on both data ownerships.
  
  Order persistence is not a capability of this board: there is no declared
  ordering slot in `@objectstack/spec` for one to be written to. Ruled on
  objectui#8826.
- c6ae7b2: Kanban cards no longer draw an empty coloured badge for a card field that resolves to no label.
  
  The explicit-card-field loop's guard (`raw == null || raw === ''`) let an empty array
  through, and the branch it then took for any field carrying declared `options` never
  reached the shared `@object-ui/fields` cell renderers — it resolved a label and colour
  itself. With nothing to resolve, a fully styled, fully coloured pill was drawn with
  nothing inside it, on the most commonly authored shape of all: a picklist that declares
  its options.
  
  Both badge-push sites now decline a badge whose resolved label is empty. This also closes
  the half that has nothing to do with arrays — any value resolving to an empty label drew
  the same pill. A legitimately authored `'0'` label still renders: the test is against the
  empty string, not falsiness.
- Updated dependencies [432882b]
- Updated dependencies [64dae8e]
- Updated dependencies [b06e374]
- Updated dependencies [06a8af5]
- Updated dependencies [6a91586]
- Updated dependencies [a04d7c6]
- Updated dependencies [5ccc500]
- Updated dependencies [9801765]
- Updated dependencies [460575f]
- Updated dependencies [d796c8d]
- Updated dependencies [594704f]
- Updated dependencies [d3995fe]
- Updated dependencies [1b1d772]
- Updated dependencies [d88e20f]
- Updated dependencies [f66072d]
- Updated dependencies [2d7304d]
- Updated dependencies [636b236]
- Updated dependencies [4172589]
- Updated dependencies [64d624d]
- Updated dependencies [053fdc8]
- Updated dependencies [41b7ce3]
- Updated dependencies [ae476b8]
- Updated dependencies [39f4309]
- Updated dependencies [d2fb6ef]
- Updated dependencies [7cd3987]
- Updated dependencies [ee3b878]
- Updated dependencies [e304a4e]
- Updated dependencies [490d9a9]
- Updated dependencies [1117414]
- Updated dependencies [6d63cd0]
- Updated dependencies [fc62bb4]
- Updated dependencies [41df893]
- Updated dependencies [7c96c94]
- Updated dependencies [4da5109]
- Updated dependencies [00f3eb5]
- Updated dependencies [1ec291c]
- Updated dependencies [453dbaa]
- Updated dependencies [95f8704]
- Updated dependencies [f8cdbf2]
- Updated dependencies [69a2163]
- Updated dependencies [24e027e]
- Updated dependencies [2c3cd1b]
- Updated dependencies [e176053]
- Updated dependencies [e30ed15]
- Updated dependencies [90665e0]
- Updated dependencies [8d3a529]
- Updated dependencies [5ac2e2c]
- Updated dependencies [194fae1]
- Updated dependencies [63d54dd]
- Updated dependencies [7e19d03]
- Updated dependencies [b08b7eb]
- Updated dependencies [546ddf7]
- Updated dependencies [864154e]
- Updated dependencies [b023625]
- Updated dependencies [75bd83d]
- Updated dependencies [44d075b]
- Updated dependencies [40c479a]
- Updated dependencies [b4393e5]
- Updated dependencies [971d387]
- Updated dependencies [ee851c3]
- Updated dependencies [6414dfd]
- Updated dependencies [a8d5c71]
- Updated dependencies [905b21f]
- Updated dependencies [88e9109]
- Updated dependencies [2c45966]
- Updated dependencies [db3a600]
- Updated dependencies [6fd2cf7]
- Updated dependencies [5fa06c4]
- Updated dependencies [52a43de]
- Updated dependencies [e4559d1]
- Updated dependencies [2c71482]
- Updated dependencies [129bcc5]
- Updated dependencies [d3005f7]
- Updated dependencies [1e7fe0a]
- Updated dependencies [a26b9e4]
- Updated dependencies [5ef9c4f]
- Updated dependencies [46f0bb4]
- Updated dependencies [8ec11e1]
- Updated dependencies [6f81384]
- Updated dependencies [22ba927]
- Updated dependencies [8631c32]
- Updated dependencies [f8c70f4]
- Updated dependencies [5d3a2d1]
- Updated dependencies [8f1d995]
- Updated dependencies [b362c1b]
- Updated dependencies [f9c34df]
- Updated dependencies [dddb942]
- Updated dependencies [00c665e]
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
- Updated dependencies [9602dc8]
- Updated dependencies [3777538]
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
- Updated dependencies [fff9645]
- Updated dependencies [9c3b7ce]
- Updated dependencies [2c1c967]
- Updated dependencies [9486ac6]
- Updated dependencies [9486ac6]
- Updated dependencies [4d5f9b4]
- Updated dependencies [d6ceb8d]
- Updated dependencies [dc4365c]
- Updated dependencies [e321d52]
- Updated dependencies [969ba84]
- Updated dependencies [98188c2]
- Updated dependencies [4c68077]
- Updated dependencies [7977ff9]
- Updated dependencies [3beef6d]
- Updated dependencies [06b8c42]
- Updated dependencies [46b9bc9]
- Updated dependencies [f46bd39]
- Updated dependencies [b98352a]
- Updated dependencies [b76ca67]
- Updated dependencies [45ac2cb]
- Updated dependencies [b97790a]
- Updated dependencies [dbd5194]
- Updated dependencies [7c9b044]
- Updated dependencies [e552c31]
- Updated dependencies [d47de51]
- Updated dependencies [3fe6463]
- Updated dependencies [b392674]
- Updated dependencies [4f3a1e2]
- Updated dependencies [31ab372]
- Updated dependencies [846889b]
- Updated dependencies [7b90231]
- Updated dependencies [26896c6]
- Updated dependencies [a439e16]
- Updated dependencies [67fc3b0]
- Updated dependencies [8579e34]
- Updated dependencies [d57db5d]
- Updated dependencies [33a3b3c]
- Updated dependencies [b87f15b]
- Updated dependencies [9409eb9]
- Updated dependencies [045d20b]
- Updated dependencies [a2d2515]
- Updated dependencies [c18d099]
- Updated dependencies [0caacca]
- Updated dependencies [adb2a86]
- Updated dependencies [03380aa]
- Updated dependencies [4562ea5]
- Updated dependencies [3619792]
- Updated dependencies [3561bd2]
- Updated dependencies [bf97b98]
- Updated dependencies [320374d]
- Updated dependencies [b0d308d]
- Updated dependencies [b458300]
- Updated dependencies [40f34b4]
- Updated dependencies [bd0376d]
- Updated dependencies [8063bcb]
- Updated dependencies [b74a859]
- Updated dependencies [d4493fd]
- Updated dependencies [240b80f]
- Updated dependencies [77cb489]
- Updated dependencies [bfaa158]
- Updated dependencies [777e5c6]
- Updated dependencies [0c386dd]
- Updated dependencies [39d69ad]
- Updated dependencies [9e37d9b]
- Updated dependencies [5ad86dd]
- Updated dependencies [16a725f]
- Updated dependencies [c4326fe]
- Updated dependencies [4dfdcc3]
- Updated dependencies [6a449fc]
- Updated dependencies [446d93d]
- Updated dependencies [ecd9cb2]
- Updated dependencies [f08bcd9]
- Updated dependencies [98d4108]
- Updated dependencies [0e3b3be]
- Updated dependencies [a29ae2d]
- Updated dependencies [220c18d]
- Updated dependencies [eeb6c2f]
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
- Updated dependencies [639114c]
- Updated dependencies [1490691]
- Updated dependencies [e8e4c4d]
- Updated dependencies [1f31d3a]
- Updated dependencies [d1842ab]
- Updated dependencies [854cba3]
- Updated dependencies [78ca238]
- Updated dependencies [d8ec8d6]
- Updated dependencies [351eb31]
- Updated dependencies [866cd1d]
- Updated dependencies [20c04b2]
- Updated dependencies [01c9023]
- Updated dependencies [48c19bd]
- Updated dependencies [a6d8b8d]
- Updated dependencies [b652514]
- Updated dependencies [adbda1b]
- Updated dependencies [adbda1b]
- Updated dependencies [8952395]
- Updated dependencies [e8c553b]
- Updated dependencies [2e32ed4]
- Updated dependencies [7c3df8f]
- Updated dependencies [a4514e8]
- Updated dependencies [6411def]
- Updated dependencies [b9f5ff1]
- Updated dependencies [e75f4c9]
- Updated dependencies [19f1639]
- Updated dependencies [4704aa4]
- Updated dependencies [47547d0]
- Updated dependencies [1bee5d0]
- Updated dependencies [63a8828]
- Updated dependencies [b61d7d8]
- Updated dependencies [858cd72]
- Updated dependencies [dc0a60b]
- Updated dependencies [554f2b6]
- Updated dependencies [72f55c9]
- Updated dependencies [26e06d7]
- Updated dependencies [669d71b]
- Updated dependencies [ed27d7c]
- Updated dependencies [52c8cf7]
- Updated dependencies [7cdd2b9]
- Updated dependencies [52c8cf7]
- Updated dependencies [3399704]
- Updated dependencies [7bf244b]
- Updated dependencies [f0bb9fa]
- Updated dependencies [81a2eb1]
- Updated dependencies [20cb8db]
- Updated dependencies [00d2fa6]
- Updated dependencies [77b2a18]
- Updated dependencies [c6198c2]
- Updated dependencies [2f61238]
- Updated dependencies [51eb515]
- Updated dependencies [c354ce5]
- Updated dependencies [8fe8e5c]
- Updated dependencies [9ae871d]
- Updated dependencies [efbd566]
- Updated dependencies [2a5bf45]
- Updated dependencies [9587fc9]
- Updated dependencies [e62c44e]
- Updated dependencies [daf9d57]
- Updated dependencies [fe8f451]
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
- Updated dependencies [c14d3a0]
- Updated dependencies [caf477f]
- Updated dependencies [f6375da]
- Updated dependencies [967e5d8]
- Updated dependencies [a4611b3]
- Updated dependencies [20316ba]
- Updated dependencies [d3499b3]
- Updated dependencies [91f9276]
- Updated dependencies [c9f9bae]
- Updated dependencies [18897a4]
- Updated dependencies [8b7ea39]
- Updated dependencies [a915064]
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
- Updated dependencies [e1c27e4]
- Updated dependencies [8c8da45]
- Updated dependencies [f52a9d7]
- Updated dependencies [cf1d29e]
- Updated dependencies [1bd79c8]
- Updated dependencies [ad852b6]
- Updated dependencies [7fb22a1]
- Updated dependencies [ad66d79]
- Updated dependencies [0758bd8]
- Updated dependencies [ee4d19f]
- Updated dependencies [37149ec]
- Updated dependencies [496d31d]
- Updated dependencies [7ed9808]
- Updated dependencies [0ea7054]
- Updated dependencies [ac0e39a]
- Updated dependencies [9a853f2]
- Updated dependencies [cb847fd]
- Updated dependencies [ee70287]
- Updated dependencies [3e98e13]
- Updated dependencies [fc32921]
- Updated dependencies [4eaa835]
- Updated dependencies [8f9d87a]
- Updated dependencies [b1777ae]
- Updated dependencies [24d1edd]
- Updated dependencies [645087c]
- Updated dependencies [33f4a19]
- Updated dependencies [6e9a3d4]
- Updated dependencies [4a292d2]
- Updated dependencies [5323168]
- Updated dependencies [841dd2b]
- Updated dependencies [dacb402]
- Updated dependencies [91facae]
- Updated dependencies [b38014e]
- Updated dependencies [e2feb13]
- Updated dependencies [474797d]
- Updated dependencies [704e695]
- Updated dependencies [9dcc545]
- Updated dependencies [d7fecfb]
- Updated dependencies [c13d39e]
- Updated dependencies [a407bd6]
- Updated dependencies [317dbce]
- Updated dependencies [309728c]
- Updated dependencies [c03d03b]
- Updated dependencies [e6ec217]
- Updated dependencies [aa08d7e]
- Updated dependencies [3a43a15]
- Updated dependencies [868e825]
- Updated dependencies [f76f436]
- Updated dependencies [ce45a03]
- Updated dependencies [7cf6f38]
- Updated dependencies [fd9c50a]
- Updated dependencies [421544b]
- Updated dependencies [5cc8c28]
- Updated dependencies [fb01022]
- Updated dependencies [e9d9212]
- Updated dependencies [ecfb693]
- Updated dependencies [639ca9d]
- Updated dependencies [2152962]
- Updated dependencies [40a7c53]
- Updated dependencies [abc1b18]
- Updated dependencies [81a51db]
- Updated dependencies [67749c7]
- Updated dependencies [507b61b]
- Updated dependencies [512c84b]
- Updated dependencies [c300267]
- Updated dependencies [fb3a101]
- Updated dependencies [d4733f2]
- Updated dependencies [1570eac]
- Updated dependencies [f391ede]
- Updated dependencies [f5cfbbd]
- Updated dependencies [f5cfbbd]
- Updated dependencies [8b532cb]
- Updated dependencies [64c3cdd]
- Updated dependencies [4d65991]
- Updated dependencies [c42554e]
- Updated dependencies [3e71b26]
- Updated dependencies [b89583b]
- Updated dependencies [70c4523]
- Updated dependencies [555b4ec]
- Updated dependencies [64f1cf1]
- Updated dependencies [da5e4f6]
- Updated dependencies [1ccfc23]
- Updated dependencies [542718f]
- Updated dependencies [7f27bc5]
- Updated dependencies [0a174f3]
- Updated dependencies [cc00c59]
- Updated dependencies [676f677]
- Updated dependencies [f95b140]
- Updated dependencies [541ce4e]
- Updated dependencies [d1865d2]
- Updated dependencies [55ba3ff]
- Updated dependencies [0b138da]
- Updated dependencies [3ecc369]
- Updated dependencies [f1190b0]
- Updated dependencies [561abef]
- Updated dependencies [ef52001]
- Updated dependencies [6a4680b]
- Updated dependencies [c3a4273]
- Updated dependencies [abf710d]
- Updated dependencies [093af32]
- Updated dependencies [6df26f0]
- Updated dependencies [1bd1be7]
- Updated dependencies [d234fa9]
- Updated dependencies [adf5812]
- Updated dependencies [0eaed83]
- Updated dependencies [2f6b2bf]
- Updated dependencies [2028b31]
- Updated dependencies [16a1a51]
- Updated dependencies [63601ab]
- Updated dependencies [c372b29]
- Updated dependencies [152f0a7]
- Updated dependencies [8693b85]
- Updated dependencies [e82dad1]
- Updated dependencies [e77a003]
- Updated dependencies [84defab]
- Updated dependencies [681d3f1]
- Updated dependencies [88561fd]
- Updated dependencies [f3bc481]
- Updated dependencies [b79aac2]
- Updated dependencies [93fc0e7]
- Updated dependencies [0601af1]
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
- Updated dependencies [9f5c017]
- Updated dependencies [c271413]
- Updated dependencies [279e48e]
- Updated dependencies [4784bb3]
- Updated dependencies [8700d6d]
- Updated dependencies [8db2a0f]
- Updated dependencies [689953a]
- Updated dependencies [30443fb]
- Updated dependencies [8d3dbb2]
- Updated dependencies [efc1c9c]
- Updated dependencies [7d6439c]
- Updated dependencies [da45e6b]
- Updated dependencies [7533465]
- Updated dependencies [835f0f3]
- Updated dependencies [6d5db7b]
- Updated dependencies [a9d97be]
- Updated dependencies [e6040ef]
- Updated dependencies [9ba7e9c]
- Updated dependencies [729e851]
- Updated dependencies [96919a4]
- Updated dependencies [345e24a]
- Updated dependencies [3bc1bb4]
- Updated dependencies [20b507a]
- Updated dependencies [2e471dc]
- Updated dependencies [6748587]
- Updated dependencies [be50942]
- Updated dependencies [53374dc]
- Updated dependencies [2bf34f7]
- Updated dependencies [15b33ae]
- Updated dependencies [7cbc724]
- Updated dependencies [4a94c38]
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
- Updated dependencies [d06fba8]
- Updated dependencies [60500cb]
- Updated dependencies [2fcefb9]
- Updated dependencies [77f846a]
- Updated dependencies [bc5870c]
- Updated dependencies [b55a346]
- Updated dependencies [065bba7]
- Updated dependencies [dd19463]
- Updated dependencies [6791717]
- Updated dependencies [8ea3bee]
- Updated dependencies [100547e]
- Updated dependencies [3a58149]
- Updated dependencies [6d1c155]
- Updated dependencies [d7573b3]
- Updated dependencies [bf3edfe]
- Updated dependencies [2c8474c]
- Updated dependencies [6ce89da]
- Updated dependencies [0e05aac]
- Updated dependencies [ae61ad4]
- Updated dependencies [5aed9e4]
- Updated dependencies [83c77dc]
- Updated dependencies [3c9fca3]
- Updated dependencies [18a8e7d]
- Updated dependencies [e7957ab]
- Updated dependencies [f7e34ca]
- Updated dependencies [e719ebd]
- Updated dependencies [f9e4f91]
- Updated dependencies [6ef48b1]
- Updated dependencies [58be55e]
- Updated dependencies [fa429cf]
- Updated dependencies [ed8df3e]
- Updated dependencies [fe76ece]
- Updated dependencies [8e74b27]
- Updated dependencies [7102b20]
- Updated dependencies [8ebd57f]
- Updated dependencies [968dc1e]
- Updated dependencies [9a1fb41]
- Updated dependencies [617707a]
- Updated dependencies [c40f3b8]
- Updated dependencies [58770f3]
- Updated dependencies [aefe428]
- Updated dependencies [485f096]
- Updated dependencies [7357447]
- Updated dependencies [199d31b]
- Updated dependencies [b655a9d]
- Updated dependencies [a865c73]
- Updated dependencies [3e01cb5]
- Updated dependencies [7138bc1]
- Updated dependencies [cef27e2]
- Updated dependencies [4e8622b]
- Updated dependencies [dffd752]
- Updated dependencies [06973aa]
- Updated dependencies [50798f3]
- Updated dependencies [6a576c9]
- Updated dependencies [0b12a33]
- Updated dependencies [105f3c5]
- Updated dependencies [3ccd9e8]
- Updated dependencies [689b979]
- Updated dependencies [c70f865]
- Updated dependencies [e546222]
- Updated dependencies [fd13f52]
- Updated dependencies [d7bd274]
- Updated dependencies [98c3a74]
- Updated dependencies [fffa30d]
- Updated dependencies [e4e9557]
- Updated dependencies [7a28e1e]
- Updated dependencies [ebce5a3]
- Updated dependencies [6c1b105]
- Updated dependencies [4dc80d0]
- Updated dependencies [9d9040d]
- Updated dependencies [20e317c]
- Updated dependencies [0fce2ef]
- Updated dependencies [42df928]
- Updated dependencies [0e2ddd4]
- Updated dependencies [b7479ab]
- Updated dependencies [9850c6e]
- Updated dependencies [de570cc]
- Updated dependencies [b2ea297]
- Updated dependencies [5b5a5c3]
- Updated dependencies [14582b8]
- Updated dependencies [51e144e]
- Updated dependencies [19cbf10]
- Updated dependencies [b6e83be]
- Updated dependencies [7e50e84]
- Updated dependencies [ab92940]
- Updated dependencies [a691c0b]
- Updated dependencies [0b1326d]
- Updated dependencies [1e66879]
- Updated dependencies [c5200f0]
- Updated dependencies [af3861f]
- Updated dependencies [2a79e84]
- Updated dependencies [2609812]
- Updated dependencies [515f171]
- Updated dependencies [1f4e029]
- Updated dependencies [4f14ad7]
- Updated dependencies [258d264]
- Updated dependencies [cac64b3]
- Updated dependencies [4bb940b]
- Updated dependencies [17fbbaf]
- Updated dependencies [d8cf1cb]
- Updated dependencies [0d1e702]
- Updated dependencies [b03ba3a]
- Updated dependencies [0068348]
- Updated dependencies [641543f]
- Updated dependencies [8a44390]
- Updated dependencies [8033ad1]
- Updated dependencies [fa140b8]
- Updated dependencies [71cba28]
- Updated dependencies [190fbd0]
- Updated dependencies [c00bf28]
- Updated dependencies [23705b7]
- Updated dependencies [93127bd]
- Updated dependencies [f2158ec]
- Updated dependencies [759606e]
- Updated dependencies [fd8dace]
- Updated dependencies [72ffc34]
- Updated dependencies [51f3d8d]
- Updated dependencies [bf28341]
- Updated dependencies [78cbdb5]
- Updated dependencies [b7543a9]
- Updated dependencies [6c6cee7]
- Updated dependencies [42887e0]
- Updated dependencies [f1690d4]
- Updated dependencies [83fe6e7]
- Updated dependencies [d1ab06f]
- Updated dependencies [38a9568]
- Updated dependencies [f90b8fb]
- Updated dependencies [91783c4]
- Updated dependencies [982885d]
- Updated dependencies [dba7d84]
- Updated dependencies [ca39427]
- Updated dependencies [bd09957]
- Updated dependencies [5a07e67]
- Updated dependencies [2d36552]
- Updated dependencies [45d8288]
- Updated dependencies [b2437a7]
- Updated dependencies [f157423]
- Updated dependencies [7a90afd]
- Updated dependencies [eddc1dd]
- Updated dependencies [490f482]
- Updated dependencies [27308c5]
- Updated dependencies [8689166]
- Updated dependencies [c9327c9]
- Updated dependencies [920165d]
- Updated dependencies [9101be5]
- Updated dependencies [f53a8d0]
- Updated dependencies [30266cf]
- Updated dependencies [968dc1e]
- Updated dependencies [57f9b07]
- Updated dependencies [3c73d99]
- Updated dependencies [d91aed9]
- Updated dependencies [ed71d9e]
- Updated dependencies [7776fc2]
- Updated dependencies [e76634c]
- Updated dependencies [c86185e]
- Updated dependencies [fb96ecb]
- Updated dependencies [1170ed1]
- Updated dependencies [92814db]
- Updated dependencies [4d73b07]
  - @object-ui/i18n@17.7.0
  - @object-ui/core@17.7.0
  - @object-ui/types@17.7.0
  - @object-ui/fields@17.7.0
  - @object-ui/components@17.7.0
  - @object-ui/plugin-detail@17.7.0
  - @object-ui/react@17.7.0
  - @object-ui/permissions@17.7.0

## 17.6.0

### Patch Changes

- feb6b16: Grid group headers, compact cards and kanban card badges honour an author-declared option hex, matching the grid cell.
  
  objectui#5141 taught the grid's cell renderer (`SelectCellRenderer`) to render an
  explicitly declared `options[].color` hex as declared instead of quantizing it
  onto one of nine palette families. Four badge call sites in `plugin-grid` and
  `plugin-kanban` still resolved through `getBadgeColorClasses`, which returns a
  class string and therefore cannot carry a runtime colour — Tailwind can only
  emit classes it saw in the source at build time.
  
  The result was worse than the bug it replaced: the same option in the same
  object rendered one colour in a desktop grid cell and a different one in the
  group header above it or on the kanban card beside it. The pre-#5141 state was
  at least uniformly wrong.
  
  All four sites now resolve exactly as the cell does — prefer
  `getBadgeHexAppearance(color)` and use its `className` **and** its `style`,
  falling back to `getBadgeColorClasses` for palette-family names, no colour, and
  every other declaration. The compact card keeps its pipeline-stage heuristic
  when the author declared no colour at all.
  
  Two carriers were widened so the style can reach the element, because these
  badges are not all plain JSX: `GroupRow` takes a `labelColorStyle` alongside
  `labelColorClass`, and a kanban card badge takes `colorStyle` alongside
  `colorClass` (`KanbanCard.badges[]`). Both additions are optional and additive;
  a badge that carries only a class renders exactly as before. The colours ride
  CSS custom properties that the class reads, so a class passed without its style
  paints against undefined variables — the two halves have to travel together.
  
  Behaviour is unchanged for every declaration that is not an explicit hex.
- 3241559: `object-kanban` now caps its fetch with a real top-level `$top`, and honours `limit`.
  
  The board's row cap was written `dataSource.find(objectName, { options: { $top: 100 }, $filter: … })`
  — `$filter` at the top level, where the adapters read it, and the cap one level
  down under `options`, which is not a `QueryParams` key. Nothing in this repo
  reads `params.options` (`convertQueryParams` in `@object-ui/data-objectstack` and
  `ApiDataSource` both read `params.$top`), so the intended cap never reached the
  wire: a board over a large object fetched every row the server would return and
  grouped all of it into lanes client-side. The author's 100 was never live.
  
  The cap is now `$top: schema.limit ?? 100`, the shape `object-timeline` took for
  the identical defect. Two consequences worth reading before upgrading:
  
  - **A board that used to fetch unbounded now fetches 100 rows by default.** That
    is the previously-declared intent taking effect, not a new limit — but a board
    over an object with more than 100 matching records will show fewer cards than
    it did. Authors who want the old behaviour should declare the window they
    actually want (`limit: 500`), not rely on the absence of one.
  - **`limit` is now mapped from the `dataSource` binding** (`object-kanban`'s
    `ElementDataSourceMapping` gains `limit: 'limit'`). A board bound to a saved
    view is capped by that view's `pagination.pageSize`, and the binding's own
    `limit` overrides it. The flag comes with the read site: it stayed unmapped
    until now on the rationale that the board had a "fixed window", which is the
    claim this change falsifies. `sort` remains unmapped — the board still has no
    `$orderby` read site — and `columns` remains unmapped because a board's columns
    are its swimlanes, not a field projection.
  
  `KanbanSchema` gains `limit?: number` (the board's row cap; distinct from a
  column's `limit`, which is that lane's WIP limit and never reaches the query),
  and the guide's per-block table in `content/docs/guide/data-source.md` no longer
  claims a fixed window for `object-kanban`.
  
  `@object-ui/fields` carried the same nesting in the lookup-name fallback
  (`find(referenceTo, { $filter: { id }, options: { $top: 1 } })`) where it was
  harmless — a primary-key equality returns at most one row with or without a cap.
  It is spelled `$top: 1` now, so no live instance of the dead nesting is left in
  the repo to read as precedent. No behaviour change there.
- 2165d88: Rename four component-props types off the names `@objectstack/spec` starts owning in
  17.0.0, keeping the old spellings as deprecated aliases. No behaviour changes and no
  importer breaks.
  
  `@objectstack/spec/ui` exports `ObjectCalendarProps`, `ObjectFormProps`, `ObjectGridProps`
  and `ObjectKanbanProps` from 17.0.0, where each is the AUTHORED props document of the
  matching element — a serialisable authoring surface (`z.input< typeof
  ObjectGridPropsSchema >`). The same-named interfaces here are the RENDERERS' props: a live
  `dataSource`, records pre-fetched by a parent, and the host callbacks. Two different things
  under one word, so the local ones are renamed rather than derived, following the split this
  repo already made for `PageHeaderProps` -> `PageHeaderComponentProps` and the
  `Record*ComponentProps` family in `@object-ui/types`:
  
  | package | new name | old name |
  |---|---|---|
  | `@object-ui/plugin-calendar` | `ObjectCalendarComponentProps` | `ObjectCalendarProps` |
  | `@object-ui/plugin-form` | `ObjectFormComponentProps` | `ObjectFormProps` |
  | `@object-ui/plugin-grid` | `ObjectGridComponentProps` | `ObjectGridProps` |
  | `@object-ui/plugin-kanban` | `ObjectKanbanComponentProps` | `ObjectKanbanProps` |
  
  Every old name is still exported from its package barrel as a `@deprecated` alias denoting
  the SAME type, pinned per package by `spec-symbol-4650.test.ts`, so existing imports keep
  compiling. New code should use the `ComponentProps` spelling.
  
  `@object-ui/app-shell` carries no API change: its `SECRET_MASK` — the ADR-0100 credential
  read mask, which 17.0.0 moves into `@objectstack/spec/data` — is renamed to
  `OBJECTUI_SECRET_MASK` at its declaration in `views/metadata-admin/widgets.tsx`. That
  constant is package-internal and is not re-exported from the barrel, so nothing published
  changes; the rename exists so the local copy cannot be read as the spec's own definition
  while this repo is still pinned below the release that exports it.
- Updated dependencies [88085e3]
- Updated dependencies [69251bf]
- Updated dependencies [57e668f]
- Updated dependencies [516663d]
- Updated dependencies [41ac1b7]
- Updated dependencies [1eaf0a1]
- Updated dependencies [7c297e3]
- Updated dependencies [a09bc33]
- Updated dependencies [460c4d0]
- Updated dependencies [0ae27f7]
- Updated dependencies [2533ec5]
- Updated dependencies [78c0f9a]
- Updated dependencies [bbe8b86]
- Updated dependencies [8477be5]
- Updated dependencies [279fb13]
- Updated dependencies [2e82ab2]
- Updated dependencies [ad07b65]
- Updated dependencies [41f498b]
- Updated dependencies [ef0d150]
- Updated dependencies [f34226e]
- Updated dependencies [564b605]
- Updated dependencies [e1d4251]
- Updated dependencies [40d3a33]
- Updated dependencies [8b9dc62]
- Updated dependencies [1184192]
- Updated dependencies [a2a9747]
- Updated dependencies [65e88e6]
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
- Updated dependencies [0bffb18]
- Updated dependencies [800f455]
- Updated dependencies [5458414]
- Updated dependencies [3241559]
- Updated dependencies [7f96b10]
- Updated dependencies [167ec42]
- Updated dependencies [616a2a5]
- Updated dependencies [6c68b13]
- Updated dependencies [0046d8f]
- Updated dependencies [f1d4748]
- Updated dependencies [bea374e]
- Updated dependencies [b1119ec]
- Updated dependencies [5607092]
- Updated dependencies [9f23d2b]
- Updated dependencies [578e025]
- Updated dependencies [af025ee]
- Updated dependencies [d109a4d]
- Updated dependencies [598c89a]
- Updated dependencies [4a0bd17]
- Updated dependencies [b8b9af4]
- Updated dependencies [31676be]
- Updated dependencies [8c0d52e]
- Updated dependencies [aff10e2]
- Updated dependencies [70a774b]
- Updated dependencies [7dd93c0]
- Updated dependencies [229b17e]
- Updated dependencies [9ce096f]
- Updated dependencies [e05db88]
- Updated dependencies [7458a41]
- Updated dependencies [ad13d63]
- Updated dependencies [5ffcc14]
- Updated dependencies [d971e51]
- Updated dependencies [97abb24]
- Updated dependencies [deb157a]
- Updated dependencies [9c60144]
- Updated dependencies [e7747f1]
- Updated dependencies [d2ce342]
- Updated dependencies [9695da7]
- Updated dependencies [ac2f332]
- Updated dependencies [a777058]
- Updated dependencies [75444e3]
- Updated dependencies [58b8346]
- Updated dependencies [2d0bd16]
- Updated dependencies [a9e17b4]
- Updated dependencies [b8ce7dc]
- Updated dependencies [dad51e5]
- Updated dependencies [1c9c342]
- Updated dependencies [787c738]
- Updated dependencies [8396656]
- Updated dependencies [dbbd38a]
- Updated dependencies [8871c14]
- Updated dependencies [93fe362]
- Updated dependencies [dfc6975]
- Updated dependencies [3cf4de0]
- Updated dependencies [c9dc811]
- Updated dependencies [144ef9b]
- Updated dependencies [138ab04]
- Updated dependencies [a0b9e91]
- Updated dependencies [99bd015]
- Updated dependencies [21e4585]
  - @object-ui/types@17.6.0
  - @object-ui/fields@17.6.0
  - @object-ui/i18n@17.6.0
  - @object-ui/react@17.6.0
  - @object-ui/plugin-detail@17.6.0
  - @object-ui/components@17.6.0
  - @object-ui/core@17.6.0

## 17.5.0

### Minor Changes

- fa21254: Kanban: a drop that makes fields required now collects them instead of dead-ending

  Dragging a card into a column whose value flips a field's `requiredWhen` predicate to TRUE used to PATCH the column value alone. The engine refused the whole update — correctly, that is what the predicate declares — and the board had no way to finish the move: the only path to closing a won deal was to abandon the board and open the record form. HotCRM's opportunity pipeline is the reported case (`win_reason` is required when `stage == "closed_won"`), but the dead end belonged to every board whose target column carries a conditional requirement.

  The board now evaluates the target column's predicates BEFORE writing anything. If the move would make fields required while they are still empty, it opens a small dialog collecting exactly those fields, then submits the column value and everything collected as ONE PATCH — never two writes, which would leave the record in the refused state if the second one failed. A drop that triggers no predicate is untouched, down to the PATCH body.

  The verdict comes from `@object-ui/core`'s `resolveFieldRuleState` — the same evaluator the record form, the wizard and the line-item grid already resolve `visibleWhen`/`readonlyWhen`/`requiredWhen` with, delegating to `@objectstack/formula`'s CEL engine. The board's prompt and the server's enforcement therefore reach the identical verdict rather than drifting through a second hand-rolled predicate evaluator. Emptiness is core's `isMissingForRequired`, the presence contract the form and the server share, so a `false` boolean and a `0` count as answers and are not re-asked.

  Every control in the dialog is `@object-ui/fields`' `FieldEditWidget`, the same widget the record form renders for that field type — a select edits as a select, a date as a date picker — so this adds no second set of field-rendering decisions.

  Four kinds of field are deliberately NOT collected, and each falls through to the unchanged PATCH where the server's refusal (legible since objectstack#7525) speaks for itself: one that already has a value, one `visibleWhen` hides, one that is readonly, and one whose type has no edit widget at all. A dialog row with no control would be a worse dead end than the one being fixed.

  Cancelling writes nothing and leaves the card in its original column; a combined PATCH that is still refused for some other reason surfaces the refusal and rolls back exactly as a plain rejected move does, rather than looping the dialog on an arbitrary server error.

  `@object-ui/i18n` carries two new `kanban.*` strings for the dialog, translated across all ten packs. Its public type surface is unchanged — the `.d.ts` was measured identical before and after — hence the patch bump.

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

- 3e19fe7: i18n copy: one ellipsis glyph across the ten packs, `usted` in the es draft-preview empty state, and a pt sentence that stops contracting `de` onto its own hole

  Three locale-copy defects that no gate could see, because all three are _value_ defects on keys whose names, placeholders and key sets were already correct.

  **One ellipsis (objectui#3878).** `en` ended 33 values with three ASCII full stops (`Loading...`, `Ask anything...`) and 110 with the typographic ellipsis `…`, and the nine translation packs had copied `en` value by value — so a user could read both glyphs on one screen: `common.loading` beside `dashboard.loading`, `console.ai.askAnything` beside its own panel's siblings. All ten packs now spell it `…` (U+2026), per the maintainer-authorized consistency pass registered on objectstack#6015. 312 pack values changed: 34 in `en` (the 33 trailing plus the one mid-sentence `collaboration.commentPlaceholder`) and 278 across the nine. Eleven inline `defaultValue` call sites were re-synchronised with the new `en` text, which `scripts/check-i18n-call-site-keys.mjs` requires byte-for-byte.

  The convention is now pinned so the split cannot regrow: `packages/i18n/src/__tests__/ellipsis-glyph-3878.test.ts` fails, by key name, on any value in any of the ten packs that holds three ASCII full stops. It is deliberately wider than "a trailing `...` in `en`", because the census showed the narrow rule would have shipped with two holes in it — `collaboration.commentPlaceholder` puts the ellipsis mid-sentence, and `list.loading` had the packs wrong while `en` was already right, which no `en`-only rule can see.

  Fifteen module-local **no-provider fallback** entries were moved with the packs, across `useCollaborationTranslation`, `useFieldTranslation`, `useDetailTranslation`, `ObjectGrid`, `KanbanImpl`, `data-table` and `ConnectionStatus`. Those maps exist to render when no `LocalizationProvider` is mounted, and each one's own docblock requires it to stay byte-identical to the `en` pack — a requirement objectui#3440 already enforces mechanically for the collaboration map. Leaving them behind would have made the provider-less path disagree with the provider path on ten keys.

  **es `usted` (objectui#3875).** `preview.empty.notReadyDescription` said `Revisa la conversación` — the tú imperative — in a namespace that is otherwise 23:1 usted, and it renders _underneath the usted draft-preview banner at the same moment_, not before or after it. `Revisa` → `Revise`; nothing else in the sentence carries a register. The neighbouring `approvalsInbox` namespace is legitimately tú and was left alone.

  **pt contraction (objectui#3877).** `ConcurrentUpdateDialog` splits `detail.concurrentUpdateDescription` on `{{field}}` and renders a bolded label in the gap, and pt left a bare `de` in front of that gap. When the multi-field conflict branch passes the record label (`este registro`), Portuguese users read `de este registro` — a contraction error every native speaker sees, and one that no spelling of the leaf value could fix (`deste registro` renders `de deste registro`). The pt sentence is rewritten so the hole is preceded by the verb `afeta` instead of any preposition, which closes the whole class rather than trading `de` for an `em` or `a` that contract just as hard. pt only; `en` is unchanged.

  No behavior, no keys added or removed, no placeholder changed.

- 2c8ad7c: A rejected Kanban drag rolls the card back on both data ownerships, not just when the board owns its own records

  Dragging a card into a column the server refuses (`PATCH` 400 `invalid_transition`) left the card sitting in the target column until a manual reload, whenever the board was hosted by a parent that supplies records through the `data` prop — the ListView/console path, which is the one real users meet. The toast fired and the server value was untouched, so the board was showing a move that had not happened.

  `handleCardMove` performed its failure revert only inside `if (!hasExternalData)`. The reasoning recorded next to it was that the parent handles the refresh, and for an accepted move it does — the parent's mutation subscription refetches and the new value propagates. A _rejected_ move changes nothing server-side, so no refetch is ever triggered and nothing un-said the optimistic move.

  The revert is now unconditional, which is also what makes it a single code path rather than two. The card's on-screen position does not live in `ObjectKanban` at all: the board component moves the card inside its own column state before reporting the move upward, and re-syncs that state from its `columns` prop whenever the prop's identity changes — which any re-render of `ObjectKanban` produces, since the renderer re-buckets the records into fresh column arrays. On the internal path the revert corrects the record and re-renders; on the external path it re-renders against the parent's records, which the server never changed, and the re-bucket puts the card back where it started.

  The optimistic write on the way _in_ stays gated on internal data deliberately, and the asymmetry is now pinned by tests: writing it on the external path would re-render against the unchanged parent records and snap an accepted move back before the server had answered. Accepted moves on both paths, and the existing rejection toast, are covered by controls alongside the regression test.

- Updated dependencies [0e67b53]
- Updated dependencies [ceccdcf]
- Updated dependencies [d6e5124]
- Updated dependencies [debad27]
- Updated dependencies [dc2aa3e]
- Updated dependencies [ee66e2e]
- Updated dependencies [e2e6360]
- Updated dependencies [ee26e65]
- Updated dependencies [5900ac5]
- Updated dependencies [932cbcd]
- Updated dependencies [734d186]
- Updated dependencies [f650253]
- Updated dependencies [6d01319]
- Updated dependencies [3d9769a]
- Updated dependencies [8f85f8b]
- Updated dependencies [d0c3b26]
- Updated dependencies [3fc2971]
- Updated dependencies [aca27fa]
- Updated dependencies [dde7283]
- Updated dependencies [f7c6430]
- Updated dependencies [4dadf0d]
- Updated dependencies [ae10a01]
- Updated dependencies [0f21348]
- Updated dependencies [d2e2caf]
- Updated dependencies [92876f0]
- Updated dependencies [f279deb]
- Updated dependencies [4b70d28]
- Updated dependencies [eb7f586]
- Updated dependencies [e901131]
- Updated dependencies [ebb4e0e]
- Updated dependencies [3a9021e]
- Updated dependencies [d9d3463]
- Updated dependencies [2a40f69]
- Updated dependencies [bec3e14]
- Updated dependencies [613b167]
- Updated dependencies [b4d3c22]
- Updated dependencies [1f9b905]
- Updated dependencies [8f60d73]
- Updated dependencies [cb13400]
- Updated dependencies [828549a]
- Updated dependencies [e1ade8f]
- Updated dependencies [bc64bfe]
- Updated dependencies [abb0f81]
- Updated dependencies [38ab505]
- Updated dependencies [63fe8fd]
- Updated dependencies [3e19fe7]
- Updated dependencies [bb58d1d]
- Updated dependencies [433ff9f]
- Updated dependencies [5cc847c]
- Updated dependencies [6314e87]
- Updated dependencies [5e2e9fa]
- Updated dependencies [297534b]
- Updated dependencies [e7663f2]
- Updated dependencies [fa21254]
- Updated dependencies [33c32bf]
- Updated dependencies [66fb4fa]
- Updated dependencies [b953a97]
- Updated dependencies [e076fd5]
- Updated dependencies [d7f3e30]
- Updated dependencies [6d641c9]
- Updated dependencies [7e4f0e5]
- Updated dependencies [a84385b]
- Updated dependencies [45e1949]
- Updated dependencies [92250d6]
- Updated dependencies [c1d939f]
- Updated dependencies [58bebf6]
- Updated dependencies [36310dc]
- Updated dependencies [52d878a]
- Updated dependencies [456aac8]
- Updated dependencies [405e808]
- Updated dependencies [49ae9f4]
- Updated dependencies [a3ae404]
- Updated dependencies [7d04b0e]
- Updated dependencies [bfdf3d4]
- Updated dependencies [bb68488]
- Updated dependencies [c0f9a4b]
- Updated dependencies [b1e42d0]
- Updated dependencies [2459a3e]
- Updated dependencies [ac853ce]
- Updated dependencies [fa51109]
- Updated dependencies [d6aa172]
- Updated dependencies [c32a8a1]
- Updated dependencies [fe52a04]
- Updated dependencies [d46f9b8]
- Updated dependencies [3f5f87c]
- Updated dependencies [2fea4d2]
- Updated dependencies [f5e1143]
- Updated dependencies [dad805d]
- Updated dependencies [7f1cb33]
- Updated dependencies [f148a64]
- Updated dependencies [bb68488]
- Updated dependencies [2e3b0c0]
- Updated dependencies [35997ce]
- Updated dependencies [9461dd3]
- Updated dependencies [78fa331]
- Updated dependencies [47f551b]
- Updated dependencies [31ab1ac]
- Updated dependencies [0082db8]
- Updated dependencies [ab04728]
- Updated dependencies [b388950]
- Updated dependencies [5bf09fd]
- Updated dependencies [06915b0]
- Updated dependencies [ff84b05]
  - @object-ui/i18n@17.5.0
  - @object-ui/react@17.5.0
  - @object-ui/components@17.5.0
  - @object-ui/plugin-detail@17.5.0
  - @object-ui/core@17.5.0
  - @object-ui/fields@17.5.0
  - @object-ui/types@17.5.0

## 17.4.0

### Patch Changes

- 5bfaabd: `PageComponentSchema.dataSource` now reaches every object-bound block, not just
  `list-view` — and `element:record_picker` stops discarding `view`
  (objectstack#6953).

  objectstack#5576 wired the spec's per-element data binding
  (`dataSource: { object, view?, filter?, sort?, limit? }`) to `list-view` and left
  the same declaration inert on every other page component. Two gaps remained, and
  both were silent:

  - **`element:record_picker` read four of the five keys and dropped `view`.** So
    `dataSource: { object: 'account', view: 'hot' }` — the spec's own example —
    built a picker over EVERY account instead of the rows the saved view selects.
    Nothing threw and nothing rendered an error; the option list was simply wider
    than what was authored, which also means a user could select a record the page
    said was out of scope.
  - **`object-grid` / `object-form` / `object-kanban` / `object-calendar` /
    `object-chart` / `object-metric` / `record:related_list` read none of it.**
    Each gates its fetch on its own `objectName`, and nothing mapped
    `dataSource.object` onto it, so a page written the way the spec documents
    rendered an empty grid / a field-less form / a board with no cards / an empty
    month / an empty chart / a static metric number — with no request and no
    diagnostic anywhere. Spec-valid metadata rendering nothing is the
    objectstack#4413 shape.

  Composition follows objectstack#5576's landed semantics unchanged on every block:
  a named saved view supplies the baseline, a key written on the component itself
  overrides it, an explicit binding key overrides both, `filter` AND-combines
  ("additional filter criteria" — a binding can narrow a view, never widen it), and
  a `view` name that does not resolve renders a configuration error instead of
  degrading to the object's full scope.

  - `@object-ui/react` — new `useElementDataSourceSchema(schema, mapping, dataSource?)`
    and `ElementDataSourceGate` apply a resolved binding to the schema keys a given
    block reads, plus `ElementDataSourceErrorPanel` / `ElementDataSourceLoadingPanel`
    for the two non-final states. One precedence table for all blocks rather than
    one copy per block — that copy is how "additional filter criteria" would have
    become two dialects.
  - A mapping names **only** keys its block genuinely reads. A composed value
    written onto a key the block ignores would be accepted and dropped, which is
    the defect being removed, one layer deeper — so a kanban's swimlane `columns`
    never receive a view's field list, and a block with no row cap leaves `limit`
    unmapped. The per-block coverage table, including two residual gaps that are
    named rather than papered over, is in `content/docs/guide/data-source.md`.

  No behaviour changes for a block that carries no `dataSource`: the binding-free
  path returns the schema by reference, so nothing remounts and nothing refetches.

- Updated dependencies [794c497]
- Updated dependencies [993336f]
- Updated dependencies [f0a625a]
- Updated dependencies [b5980f4]
- Updated dependencies [8aad9fd]
- Updated dependencies [6719877]
- Updated dependencies [56ff091]
- Updated dependencies [0186cdc]
- Updated dependencies [7864f03]
- Updated dependencies [ea41a59]
- Updated dependencies [0cbdca8]
- Updated dependencies [d229dfa]
- Updated dependencies [ecae400]
- Updated dependencies [4bc6c23]
- Updated dependencies [d3e738a]
- Updated dependencies [c3b01a7]
- Updated dependencies [f5f8744]
- Updated dependencies [7ed3360]
- Updated dependencies [69becd2]
- Updated dependencies [5e52495]
- Updated dependencies [0fa5e4d]
- Updated dependencies [b750823]
- Updated dependencies [5bfaabd]
- Updated dependencies [e06810e]
- Updated dependencies [ab3ad4f]
- Updated dependencies [65bb513]
- Updated dependencies [c97a45e]
- Updated dependencies [b19162d]
- Updated dependencies [c2fd122]
- Updated dependencies [1bd6faa]
- Updated dependencies [ac2139c]
- Updated dependencies [b14ab3a]
- Updated dependencies [e24d767]
- Updated dependencies [7b3e048]
- Updated dependencies [8c60819]
- Updated dependencies [aca561a]
- Updated dependencies [e64a52e]
- Updated dependencies [844d17f]
- Updated dependencies [d8a0be4]
- Updated dependencies [48132f7]
- Updated dependencies [4dcd52a]
- Updated dependencies [42ae5c6]
- Updated dependencies [0ef9dfd]
- Updated dependencies [f4b97c8]
- Updated dependencies [1d723e3]
- Updated dependencies [0109f54]
- Updated dependencies [7e5bb5d]
- Updated dependencies [fbc23e0]
- Updated dependencies [6d762da]
- Updated dependencies [e6fdbdc]
- Updated dependencies [4178d5a]
- Updated dependencies [54233b1]
- Updated dependencies [c2ecbae]
- Updated dependencies [acc34c5]
- Updated dependencies [c4768a7]
- Updated dependencies [f9faa7d]
- Updated dependencies [97b63d7]
- Updated dependencies [6bb454a]
- Updated dependencies [11c1e71]
- Updated dependencies [523be48]
- Updated dependencies [7e2b7e9]
- Updated dependencies [33526fd]
- Updated dependencies [32413ec]
- Updated dependencies [c1e1e6b]
  - @object-ui/components@17.4.0
  - @object-ui/plugin-detail@17.4.0
  - @object-ui/react@17.4.0
  - @object-ui/core@17.4.0
  - @object-ui/fields@17.4.0
  - @object-ui/i18n@17.4.0
  - @object-ui/types@17.4.0

## 17.3.0

### Patch Changes

- d915c47: Relation fields (`lookup` / `master_detail` / `user` / `tree`) are now usable in action and conditional-formatting predicates: they bind as the stored foreign key on every surface, and the fields a predicate reads are included in the query projection (#3501).

  Before this, one predicate over one relation field had four different fates, decided by things its author does not control. `$expand` **replaces** the id in place with the whole related record, and a view expands exactly the relations it shows as COLUMNS — so `record.owner == "U1"` was **true** where the column was absent, **false** where it was displayed, and a **fault** where the field was neither displayed nor projected (a list's `$select` was built from its columns alone, and CEL treats an absent key as a fault, not as null). A fault is fail-CLOSED on the row kebab and the selection bar and fail-OPEN on the lenient paths, so the same authoring mistake hid the button from everyone on one surface and showed it to everyone on the next, with nothing on screen to point at either. The server, meanwhile, only ever sees the id — so client and server could not agree, which is the one thing ADR-0036 / ADR-0058 exist to guarantee.

  Two changes close it. `toPredicateRecord` (new, `@object-ui/core`) collapses expanded relation values back to their ids when a record is bound for evaluation — driven by the object's own field types, not by sniffing for an `id` key, so a `json` field that happens to carry one is untouched. It is threaded through `evalRowPredicate` / `resolveConditionalFormatting` (via a new `fields` option), `useRowPredicate`, `partitionBulkRows`, and both `page:header` evaluators, with the object schema supplied by `ObjectGrid` / `ListView` / `ObjectKanban` / the record context. Kanban card formatting is threaded the same way, so a rule cannot match on the grid view of a list and silently never match on its board. Display is unaffected — a detail-page title still renders the related record's name, and the schema-only `kanban-ui` entry point (which has no object schema to offer) keeps using the payload verbatim. `collectPredicateFieldRefs` / `listViewPredicates` (new) harvest the `record.x` / `data.x` references out of a view's conditional formatting, row-action defs, bulk-action defs, promoted object actions and `userActions` overrides, and add them to `$select` — intersected with the object's declared fields plus the platform columns every object carries (`isProjectableField`), because an unknown key is not ignored by every backend. No `$expand` is added: a predicate wants the foreign key, which is what an unexpanded relation already is.

- aa36e60: Localize the record-detail headings that `ObjectKanban`, `ObjectTree` and
  `ObjectView` build themselves (objectui#3459)

  #3426 / PR #3457 keyed `ListView` and `ObjectGrid`; a repo-wide grep found the
  same pattern in three more hosts, each string-building an English heading in
  TypeScript so the surrounding drawer/panel was fully localized with one English
  phrase on top of it.

  - `packages/plugin-kanban/src/ObjectKanban.tsx` — the object-derived heading of
    the card-detail drawer
  - `packages/plugin-tree/src/ObjectTree.tsx` — the bare literal
    `"Record Details"` handed to `NavigationOverlay`
  - `packages/plugin-view/src/ObjectView.tsx` — `` `${objectLabel} Detail` `` on
    the `mode: 'split'` panel

  All three are user-reachable, each verified by a test that drives the real
  interaction (render the block, click a card/row, read the heading), not by
  inspection:

  - `object-kanban` is a public page block whose `navigation` config DEFAULTS to
    `{ mode: 'drawer' }`, so a board needs no authoring at all to open this
    drawer on card click;
  - `object-tree` needs `navigation: { mode: 'drawer' }` authored explicitly, and
    every row's click is wired to `navigation.handleClick`;
  - `object-view` declares `navigation` as an authorable input and maps
    `mode: 'split'` onto the branch that renders this heading.

  ## What changed

  Each call site now keys its heading through the existing `detail.*` pair —
  `detail.recordDetailWithLabel` (`'{{label}} Detail'`) where an object label is
  available, `detail.recordDetail` where none is. No new locale keys: both
  already ship in all ten packs from #3457, and reusing them keeps one heading on
  one control instead of minting per-plugin twins that drift.

  Each plugin gains its own English defaults map, which is what
  `createSafeTranslation` falls back to with no `I18nProvider` mounted;
  `@object-ui/plugin-tree` gains a dependency on `@object-ui/i18n` for it.

  ## Visible English change

  One, deliberate: the tree overlay's heading goes from the plural
  `Record Details` to the singular `Record Detail` — the spelling the whole
  `detail.*` family, including `NavigationOverlay`'s own default, already uses.
  The maintainer ruled on normalizing the stray plurals rather than minting a
  plural key; a repo-wide grep confirmed no `e2e/` spec and no unit test
  addressed the old string.

  Every other branch is byte-identical in English (`Contacts Detail`,
  `Support cases Detail`, `Contacts Detail`), with and without a provider —
  pinned by a provider-less test file per plugin, kept separate because
  `initReactI18next` registers its instance as a module global that outlives
  `cleanup()`.

  The kanban's other former plural (`'Card Details'`) is NOT a visible change: it
  sat on a branch that fires only when the board has no `objectName`, while the
  drawer consuming it returns `null` on that very condition. It is keyed anyway
  so the literal cannot leak if that guard ever relaxes, and it deliberately has
  no test — an assertion there would pass because nothing renders.

- Updated dependencies [18cd432]
- Updated dependencies [b7165ce]
- Updated dependencies [532cf8b]
- Updated dependencies [680080a]
- Updated dependencies [a7651e6]
- Updated dependencies [d915c47]
- Updated dependencies [b71fc92]
- Updated dependencies [65516ba]
- Updated dependencies [94c5b7c]
- Updated dependencies [ca0fa8f]
- Updated dependencies [34595eb]
- Updated dependencies [3889ffb]
- Updated dependencies [5781fb1]
- Updated dependencies [7e2406a]
- Updated dependencies [bbbde12]
- Updated dependencies [5a24ad9]
- Updated dependencies [9e9e9a9]
- Updated dependencies [19b8c9b]
- Updated dependencies [56409c2]
- Updated dependencies [042e09d]
- Updated dependencies [7d08c3f]
- Updated dependencies [9cbcbf4]
- Updated dependencies [85c4c9c]
- Updated dependencies [fd54c3e]
- Updated dependencies [4eeb932]
- Updated dependencies [6fe485b]
- Updated dependencies [5c856ec]
- Updated dependencies [23018cc]
- Updated dependencies [58a00f0]
- Updated dependencies [53811d1]
- Updated dependencies [b17ce4c]
- Updated dependencies [68b6a28]
- Updated dependencies [0554e88]
- Updated dependencies [d915c47]
- Updated dependencies [f44d872]
- Updated dependencies [28b2e65]
- Updated dependencies [509104a]
- Updated dependencies [825bbe3]
- Updated dependencies [6195841]
- Updated dependencies [5dd0127]
- Updated dependencies [06632e9]
- Updated dependencies [c7fba27]
- Updated dependencies [a415684]
- Updated dependencies [a4cff5b]
- Updated dependencies [175bd79]
- Updated dependencies [5af2852]
- Updated dependencies [12bf669]
- Updated dependencies [34d9169]
- Updated dependencies [5881a2c]
- Updated dependencies [9bc3709]
- Updated dependencies [f833d3a]
- Updated dependencies [30ae33a]
- Updated dependencies [a6ec93d]
- Updated dependencies [2a9513d]
- Updated dependencies [49f7449]
- Updated dependencies [71be406]
- Updated dependencies [d22ae31]
- Updated dependencies [c7ed4c3]
- Updated dependencies [2409e1d]
- Updated dependencies [789fe3e]
- Updated dependencies [f789c3b]
- Updated dependencies [a321fa4]
- Updated dependencies [8d8094a]
  - @object-ui/core@17.3.0
  - @object-ui/fields@17.3.0
  - @object-ui/components@17.3.0
  - @object-ui/plugin-detail@17.3.0
  - @object-ui/types@17.3.0
  - @object-ui/i18n@17.3.0
  - @object-ui/react@17.3.0

## 17.2.0

### Patch Changes

- Updated dependencies [4ae0ac4]
- Updated dependencies [696e3c1]
- Updated dependencies [bca45cc]
- Updated dependencies [6be575c]
- Updated dependencies [a889e31]
- Updated dependencies [09d30a4]
- Updated dependencies [4bf612c]
- Updated dependencies [335041c]
- Updated dependencies [b414983]
- Updated dependencies [256f8cc]
- Updated dependencies [d9668a7]
- Updated dependencies [4b470b9]
- Updated dependencies [785b8a5]
- Updated dependencies [cb82705]
- Updated dependencies [f572849]
- Updated dependencies [4a51e77]
- Updated dependencies [f6e8d78]
- Updated dependencies [ea96284]
- Updated dependencies [d3584c6]
- Updated dependencies [dd06bcd]
- Updated dependencies [a8ad6c0]
- Updated dependencies [444457c]
- Updated dependencies [850033c]
- Updated dependencies [022e4c3]
- Updated dependencies [009e25d]
- Updated dependencies [726b89c]
  - @object-ui/types@17.2.0
  - @object-ui/components@17.2.0
  - @object-ui/core@17.2.0
  - @object-ui/plugin-detail@17.2.0
  - @object-ui/react@17.2.0
  - @object-ui/i18n@17.2.0
  - @object-ui/fields@17.2.0

## 17.1.0

### Patch Changes

- Updated dependencies [62311b6]
- Updated dependencies [fc0272a]
- Updated dependencies [9e7349e]
- Updated dependencies [8864971]
- Updated dependencies [1cf0de7]
- Updated dependencies [752e18f]
- Updated dependencies [c785740]
- Updated dependencies [b41f401]
- Updated dependencies [19e9fa0]
- Updated dependencies [d61efd1]
- Updated dependencies [95b7214]
- Updated dependencies [7d9734d]
- Updated dependencies [6ae818e]
- Updated dependencies [9eb932b]
- Updated dependencies [746dd00]
- Updated dependencies [aebfa4f]
- Updated dependencies [38ca8be]
- Updated dependencies [3cb9646]
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
- Updated dependencies [d21794c]
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
- Updated dependencies [aecc934]
- Updated dependencies [5b084eb]
- Updated dependencies [aa1240a]
- Updated dependencies [2374a49]
- Updated dependencies [390c071]
- Updated dependencies [d10f526]
- Updated dependencies [2baa13f]
- Updated dependencies [bac266c]
- Updated dependencies [2d5d594]
- Updated dependencies [ea7f477]
- Updated dependencies [379728f]
- Updated dependencies [7f23cd0]
- Updated dependencies [0ded602]
- Updated dependencies [24e0e0a]
- Updated dependencies [f8a95e5]
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
  - @object-ui/plugin-detail@17.1.0
  - @object-ui/react@17.1.0
  - @object-ui/types@17.1.0
  - @object-ui/i18n@17.1.0
  - @object-ui/fields@17.1.0

## 17.0.0

### Patch Changes

- ba73a02: fix(kanban): surface off-column records in an "Uncategorized" lane instead of dropping them (#2792)

  Records whose `groupBy` value matched no declared column were bucketed and then silently discarded — the board rendered empty while the list footer still counted the rows, so it read as data loss (a status the board doesn't render, an edited/removed picklist option, imported legacy data, or an empty value all triggered it). They now land in a trailing "Uncategorized" lane so no record is invisible and the visible card total reconciles with the record count. Dragging a card out of that lane into a real column repairs its status; the drag handler refuses to persist a move _into_ the lane (its sentinel id is not a real option). Adds `kanban.uncategorized` to the en/zh bundles.

- Updated dependencies [7b21891]
- Updated dependencies [0b3be01]
- Updated dependencies [3c4d935]
- Updated dependencies [4b1ed7d]
- Updated dependencies [4b60d2d]
- Updated dependencies [952b978]
- Updated dependencies [de5e40c]
- Updated dependencies [1a03af6]
- Updated dependencies [3e886eb]
- Updated dependencies [cfc675e]
- Updated dependencies [20df08c]
- Updated dependencies [1767124]
- Updated dependencies [8ecf5a6]
- Updated dependencies [af705b9]
- Updated dependencies [0502a7c]
- Updated dependencies [7b35e4b]
- Updated dependencies [8fb1295]
- Updated dependencies [e16ed2d]
- Updated dependencies [c6fd752]
- Updated dependencies [f9bbddb]
- Updated dependencies [dfd3705]
- Updated dependencies [c77108c]
- Updated dependencies [2735de6]
- Updated dependencies [697cda4]
- Updated dependencies [c19ac11]
- Updated dependencies [6dee2cb]
- Updated dependencies [e05f052]
- Updated dependencies [0502a7c]
- Updated dependencies [faad45e]
- Updated dependencies [09c6a17]
- Updated dependencies [c7cff19]
- Updated dependencies [ba73a02]
- Updated dependencies [cd09a7b]
- Updated dependencies [f1abf0e]
- Updated dependencies [f05b84e]
- Updated dependencies [9b4b952]
- Updated dependencies [341bfb5]
- Updated dependencies [2f947e4]
- Updated dependencies [7d46648]
- Updated dependencies [9b53d72]
- Updated dependencies [bb4aa25]
- Updated dependencies [75f1cdf]
- Updated dependencies [662bdf9]
- Updated dependencies [059a052]
- Updated dependencies [53642d4]
- Updated dependencies [8aae006]
- Updated dependencies [c6cfdf1]
- Updated dependencies [d147a13]
- Updated dependencies [c6aaed8]
- Updated dependencies [263f885]
- Updated dependencies [dc334da]
  - @object-ui/components@17.0.0
  - @object-ui/plugin-detail@17.0.0
  - @object-ui/i18n@17.0.0
  - @object-ui/fields@17.0.0
  - @object-ui/react@17.0.0
  - @object-ui/types@17.0.0
  - @object-ui/core@17.0.0

## 16.1.0

### Patch Changes

- ebe6494: chore(lint): clear the baseline lint errors in nine more packages (objectui#2713 Wave 2)

  Second wave of the #2713 lint-gate restoration (after #2730). These nine package
  lints were red at baseline on `main`, so their per-package `lint` gate could not
  catch new violations. Cleared every **error** (no behavior change; warnings out
  of scope):

  - **`react-hooks/rules-of-hooks`** (`i18n`, `plugin-grid`, `plugin-view`,
    `plugin-list`) — translation helpers (`useSafeFieldLabel`,
    `useRowActionTranslation`, `useViewLabel`, `useViewTabLabel`, `useMoreLabel`)
    wrapped a provider-safe hook (`useObjectTranslation`/`useObjectLabel`, which
    never throw) in try/catch; removed the wrapper (the same fix #2709 applied in
    fields). `plugin-kanban` `ObjectKanban` moved its `if (error)` early return
    below the `useCallback` so hooks run unconditionally. `collaboration`
    `__unsafe_usePresenceContext` keeps its deliberate danger-prefix name via a
    justified scoped disable.
  - **`react-hooks/static-components`** (`layout`, `plugin-list`, `plugin-report`)
    — dynamic-icon / registry lookups (`resolveIcon`, `useRegistryComponent`) are
    stable component references, not components created during render → scoped
    disable with justification. `plugin-charts` `TreemapCell` was a _genuine_
    inline component and is hoisted to module scope (it is purely props-driven).
  - **`no-irregular-whitespace`** (`plugin-grid` `ImportWizard`) — the literal
    U+FEFF BOM prepended to exported CSV/text blobs (so Excel detects UTF-8) is
    now written as the `﻿` escape: byte-identical at runtime, no literal
    irregular-whitespace character in source.
  - **`no-useless-assignment`** (`plugin-grid` `BulkActionDialog`) — dropped a
    dead `= null` initializer that the exhaustive `switch` (incl. `default`)
    overwrites before it is read.
  - **`no-unsafe-function-type`** (`plugin-view` `ViewTabBar`) — the dnd-kit
    render-prop `listeners` map is typed `Record<string, (...args: any[]) => void>`
    instead of bare `Function`.
  - **`no-require-imports`** (`plugin-kanban`, `plugin-view` tests) — hoisted
    `vi.mock` factories use an `async` factory with `await import('react')`.

- Updated dependencies [0318118]
- Updated dependencies [1c8935a]
- Updated dependencies [af1b0db]
- Updated dependencies [8b8b744]
- Updated dependencies [7cf4051]
- Updated dependencies [803558e]
- Updated dependencies [aefcf39]
- Updated dependencies [2e7d7f0]
- Updated dependencies [ef14f69]
- Updated dependencies [94d4876]
- Updated dependencies [53513a4]
- Updated dependencies [1100a8b]
- Updated dependencies [7abe4cd]
- Updated dependencies [69fa5d1]
- Updated dependencies [f329ec5]
- Updated dependencies [549c67d]
- Updated dependencies [ebe6494]
- Updated dependencies [2b17339]
- Updated dependencies [31b77d4]
- Updated dependencies [6d4fbe6]
- Updated dependencies [0a3710b]
- Updated dependencies [f80aaf2]
- Updated dependencies [62b9ab5]
- Updated dependencies [14cb729]
- Updated dependencies [1629313]
- Updated dependencies [29c6040]
- Updated dependencies [faebac3]
- Updated dependencies [2331ac9]
- Updated dependencies [199fa83]
- Updated dependencies [eee4ded]
- Updated dependencies [3b2e4d9]
  - @object-ui/fields@16.1.0
  - @object-ui/i18n@16.1.0
  - @object-ui/core@16.1.0
  - @object-ui/types@16.1.0
  - @object-ui/react@16.1.0
  - @object-ui/plugin-detail@16.1.0
  - @object-ui/components@16.1.0

## 16.0.0

### Patch Changes

- Updated dependencies [d3e19ed]
- Updated dependencies [59d4fa9]
- Updated dependencies [4c7c47f]
- Updated dependencies [210806a]
- Updated dependencies [9d4a429]
- Updated dependencies [b4ef588]
- Updated dependencies [ca0f5f0]
- Updated dependencies [5534535]
- Updated dependencies [9b8f978]
- Updated dependencies [195a651]
- Updated dependencies [33b4995]
  - @object-ui/react@16.0.0
  - @object-ui/plugin-detail@16.0.0
  - @object-ui/components@16.0.0
  - @object-ui/types@16.0.0
  - @object-ui/i18n@16.0.0
  - @object-ui/fields@16.0.0
  - @object-ui/core@16.0.0

## 15.0.0

### Patch Changes

- Updated dependencies [bb22788]
  - @object-ui/plugin-detail@15.0.0
  - @object-ui/types@15.0.0
  - @object-ui/core@15.0.0
  - @object-ui/i18n@15.0.0
  - @object-ui/react@15.0.0
  - @object-ui/components@15.0.0
  - @object-ui/fields@15.0.0

## 14.1.0

### Minor Changes

- d741937: feat(kanban): default card fields to the object's `highlightFields` when a view configures none (ADR-0085 follow-up, #2162)

  `ObjectKanban` used to render explicit view-level `cardFields` and, when a board
  declared none, drop straight to a legacy semantic-field heuristic (guessing at
  amount / owner / priority). That guesswork ignored the object's own declared
  intent and diverged from every other surface.

  Card fields now resolve through a shared `resolveKanbanCardFields` helper in
  priority order:

  1. **View-level `cardFields`** — the author's explicit choice always wins.
  2. **The object's `highlightFields`** — the ADR-0085 semantic role (its curated
     "most important fields"), the same list Grid, List and Detail already default
     to. Entries referencing a field the object no longer declares are dropped.
  3. **The legacy semantic-field heuristic** — used only when neither is available.

  A board over an object with no per-view card config now shows the same curated
  fields as the object's other views, instead of best-effort guesses.

- dea65f7: Unify the list-view conditional tier onto the canonical CEL engine (#1584).

  Conditional formatting (list / grid / kanban) and row-action `visible` /
  `disabled` predicates are now evaluated by `@objectstack/formula`'s
  `ExpressionEngine` — the same engine the server uses — instead of the legacy
  JS-dialect `ExpressionEvaluator`, matching how `@objectstack/spec` already types
  these surfaces (`ExpressionInputSchema` / CEL). The whole platform now speaks one
  expression dialect (framework ADR-0058).

  - `@object-ui/core`: new `evalRowPredicate` + `resolveConditionalFormatting`
    helpers (next to `evalFieldPredicate`). One implementation of all three
    formatting rule shapes; dialect routing (a `{ dialect: 'cel' }` envelope is
    always CEL; a bare string is CEL unless it carries legacy-only syntax
    (`${…}` / `===` / `?.` / `.includes()`), which routes to the old engine with a
    one-time deprecation warning); the native `{ field, operator, value }` form is
    translated to CEL.
  - `@object-ui/react`: new `useRowPredicate` hook (canonical CEL, ambient
    predicate scope merged).
  - Consumers converged: `ListView.evaluateConditionalFormatting` (thin wrapper,
    export kept), `ObjectGrid` row styling (inline copy removed), kanban card
    styles, and the grid / data-table row-action menus. `plugin-view`'s kanban
    branch now forwards top-level `conditionalFormatting` (previously dropped).
  - Row-action `visible` fails **closed** (broken predicate → hidden + warn);
    `disabled` fails soft. The CEL `in` operator (and list membership) now work in
    row predicates — the legacy engine could not parse them.
  - The legacy `FormField.condition: { field, equals/notEquals/in }` is retired to
    a CEL translation (back-compat preserved); `FieldDesigner` migrated to
    `visibleWhen`.

  Fully back-compat: existing conditional-formatting rules, row-action predicates,
  and form `condition` metadata keep working (translated / routed as needed).

### Patch Changes

- 9e2d58f: Kanban `conditionalFormatting` now accepts CEL rules in its type + schema (#1584 follow-up).

  Since #1584 moved kanban card styling onto the shared CEL evaluator, the runtime
  already accepts the spec `{ condition, style }` rule shape — but the type and zod
  schema still only allowed the native `{ field, operator, value }` shape, so a
  CEL kanban rule failed validation for something that worked at runtime. The
  `KanbanConditionalFormattingRule` type and `ObjectKanbanSchema` zod schema are
  widened to a union of both shapes, matching list/grid `conditionalFormatting` and
  the runtime. Back-compat: the native shape keeps validating unchanged.

- Updated dependencies [82441e4]
- Updated dependencies [2efa9fd]
- Updated dependencies [0890fa7]
- Updated dependencies [2ded18c]
- Updated dependencies [e628d1f]
- Updated dependencies [5523fc4]
- Updated dependencies [887062c]
- Updated dependencies [471c5d3]
- Updated dependencies [579b24d]
- Updated dependencies [2b30583]
- Updated dependencies [23d65c3]
- Updated dependencies [055e1d2]
- Updated dependencies [f9a7907]
- Updated dependencies [9e2d58f]
- Updated dependencies [dea65f7]
- Updated dependencies [f30ff68]
- Updated dependencies [073e7aa]
- Updated dependencies [3e8bf07]
- Updated dependencies [6c0135c]
- Updated dependencies [5b52624]
- Updated dependencies [4afb251]
- Updated dependencies [d5b1bc0]
- Updated dependencies [f94905d]
- Updated dependencies [2712fc1]
- Updated dependencies [f0f10f5]
  - @object-ui/i18n@14.1.0
  - @object-ui/plugin-detail@14.1.0
  - @object-ui/fields@14.1.0
  - @object-ui/core@14.1.0
  - @object-ui/types@14.1.0
  - @object-ui/react@14.1.0
  - @object-ui/components@14.1.0

## 14.0.0

### Patch Changes

- Updated dependencies [443360a]
- Updated dependencies [c70bca7]
- Updated dependencies [86c69c3]
- Updated dependencies [05e56ca]
- Updated dependencies [a44e7b6]
- Updated dependencies [eef832b]
- Updated dependencies [5971cc4]
- Updated dependencies [6a74160]
  - @object-ui/core@14.0.0
  - @object-ui/i18n@14.0.0
  - @object-ui/react@14.0.0
  - @object-ui/types@14.0.0
  - @object-ui/components@14.0.0
  - @object-ui/plugin-detail@14.0.0
  - @object-ui/fields@14.0.0

## 13.2.0

### Patch Changes

- Updated dependencies [80901aa]
- Updated dependencies [53c40c2]
- Updated dependencies [e492b9d]
  - @object-ui/components@13.2.0
  - @object-ui/plugin-detail@13.2.0
  - @object-ui/i18n@13.2.0
  - @object-ui/fields@13.2.0
  - @object-ui/react@13.2.0
  - @object-ui/types@13.2.0
  - @object-ui/core@13.2.0

## 13.1.0

### Patch Changes

- @object-ui/types@13.1.0
- @object-ui/core@13.1.0
- @object-ui/i18n@13.1.0
- @object-ui/react@13.1.0
- @object-ui/components@13.1.0
- @object-ui/fields@13.1.0
- @object-ui/plugin-detail@13.1.0

## 13.0.0

### Patch Changes

- Updated dependencies [9e38270]
- Updated dependencies [ac04b76]
- Updated dependencies [619097e]
  - @object-ui/i18n@13.0.0
  - @object-ui/components@13.0.0
  - @object-ui/types@13.0.0
  - @object-ui/fields@13.0.0
  - @object-ui/plugin-detail@13.0.0
  - @object-ui/react@13.0.0
  - @object-ui/core@13.0.0

## 12.1.0

### Patch Changes

- Updated dependencies [47e72b8]
- Updated dependencies [6cbccf3]
- Updated dependencies [e1840bf]
- Updated dependencies [c31874d]
  - @object-ui/plugin-detail@12.1.0
  - @object-ui/components@12.1.0
  - @object-ui/fields@12.1.0
  - @object-ui/i18n@12.1.0
  - @object-ui/types@12.1.0
  - @object-ui/react@12.1.0
  - @object-ui/core@12.1.0

## 12.0.0

### Patch Changes

- Updated dependencies [226fde9]
- Updated dependencies [e36a9c7]
- Updated dependencies [e4de456]
- Updated dependencies [68e2d1c]
  - @object-ui/types@12.0.0
  - @object-ui/core@12.0.0
  - @object-ui/components@12.0.0
  - @object-ui/fields@12.0.0
  - @object-ui/plugin-detail@12.0.0
  - @object-ui/react@12.0.0
  - @object-ui/i18n@12.0.0

## 11.5.0

### Patch Changes

- Updated dependencies [544d8eb]
- Updated dependencies [6fffd3d]
- Updated dependencies [9255686]
- Updated dependencies [fae75e2]
- Updated dependencies [1072701]
  - @object-ui/i18n@11.5.0
  - @object-ui/react@11.5.0
  - @object-ui/plugin-detail@11.5.0
  - @object-ui/components@11.5.0
  - @object-ui/types@11.5.0
  - @object-ui/fields@11.5.0
  - @object-ui/core@11.5.0

## 11.4.0

### Patch Changes

- Updated dependencies [8bf6295]
- Updated dependencies [144ab55]
- Updated dependencies [1948c5b]
- Updated dependencies [bce581a]
- Updated dependencies [2edcaff]
- Updated dependencies [9cd9be1]
- Updated dependencies [5160832]
- Updated dependencies [69d6b94]
- Updated dependencies [c38d107]
- Updated dependencies [243a9ba]
- Updated dependencies [289be5b]
- Updated dependencies [7782698]
- Updated dependencies [19f2533]
- Updated dependencies [790558b]
- Updated dependencies [09e1b26]
- Updated dependencies [e84d64d]
  - @object-ui/types@11.4.0
  - @object-ui/plugin-detail@11.4.0
  - @object-ui/components@11.4.0
  - @object-ui/fields@11.4.0
  - @object-ui/i18n@11.4.0
  - @object-ui/core@11.4.0
  - @object-ui/react@11.4.0

## 11.3.0

### Patch Changes

- Updated dependencies [d88c8ec]
- Updated dependencies [b7237bb]
- Updated dependencies [db5ebe4]
- Updated dependencies [d23d6eb]
  - @object-ui/components@11.3.0
  - @object-ui/i18n@11.3.0
  - @object-ui/plugin-detail@11.3.0
  - @object-ui/core@11.3.0
  - @object-ui/fields@11.3.0
  - @object-ui/react@11.3.0
  - @object-ui/types@11.3.0

## 11.2.0

### Patch Changes

- Updated dependencies [32dbd6a]
- Updated dependencies [9e7a986]
- Updated dependencies [1311749]
  - @object-ui/plugin-detail@11.2.0
  - @object-ui/components@11.2.0
  - @object-ui/core@11.2.0
  - @object-ui/fields@11.2.0
  - @object-ui/react@11.2.0
  - @object-ui/types@11.2.0
  - @object-ui/i18n@11.2.0

## 11.1.0

### Patch Changes

- Updated dependencies [6726a2b]
  - @object-ui/i18n@11.1.0
  - @object-ui/components@11.1.0
  - @object-ui/fields@11.1.0
  - @object-ui/plugin-detail@11.1.0
  - @object-ui/react@11.1.0
  - @object-ui/types@11.1.0
  - @object-ui/core@11.1.0

## 7.3.0

### Patch Changes

- Updated dependencies [788dbf9]
  - @object-ui/fields@7.3.0
  - @object-ui/plugin-detail@7.3.0
  - @object-ui/types@7.3.0
  - @object-ui/core@7.3.0
  - @object-ui/i18n@7.3.0
  - @object-ui/react@7.3.0
  - @object-ui/components@7.3.0

## 7.2.0

### Patch Changes

- Updated dependencies [8e7c1da]
- Updated dependencies [d23db5c]
  - @object-ui/i18n@7.2.0
  - @object-ui/types@7.2.0
  - @object-ui/plugin-detail@7.2.0
  - @object-ui/components@7.2.0
  - @object-ui/fields@7.2.0
  - @object-ui/react@7.2.0
  - @object-ui/core@7.2.0

## 7.1.0

### Patch Changes

- Updated dependencies [677f7ed]
- Updated dependencies [08c47da]
- Updated dependencies [a71be60]
- Updated dependencies [cb03bc3]
  - @object-ui/types@7.1.0
  - @object-ui/core@7.1.0
  - @object-ui/react@7.1.0
  - @object-ui/components@7.1.0
  - @object-ui/fields@7.1.0
  - @object-ui/plugin-detail@7.1.0
  - @object-ui/i18n@7.1.0

## 7.0.0

### Patch Changes

- Updated dependencies [5976ba3]
- Updated dependencies [a00e16d]
- Updated dependencies [eaccefd]
- Updated dependencies [f7f325d]
- Updated dependencies [c12986e]
- Updated dependencies [71d7ce0]
- Updated dependencies [053c948]
- Updated dependencies [89e113c]
- Updated dependencies [ddbe4a2]
- Updated dependencies [2d47e94]
- Updated dependencies [9049bbe]
- Updated dependencies [77cc6bb]
- Updated dependencies [6c0c92c]
- Updated dependencies [97c6831]
- Updated dependencies [cb2fdb1]
- Updated dependencies [c3749eb]
- Updated dependencies [c09f44e]
- Updated dependencies [6cfa330]
- Updated dependencies [ad8ade6]
- Updated dependencies [d54346c]
- Updated dependencies [5332639]
- Updated dependencies [3870c20]
- Updated dependencies [2eb3096]
- Updated dependencies [b88c560]
- Updated dependencies [0ad72a6]
- Updated dependencies [bd398df]
- Updated dependencies [3fa23a7]
- Updated dependencies [18d0339]
- Updated dependencies [66ed3ad]
- Updated dependencies [c6445b6]
- Updated dependencies [80c133c]
- Updated dependencies [5e1b838]
- Updated dependencies [59b6bbb]
- Updated dependencies [d16566f]
- Updated dependencies [90acb7f]
- Updated dependencies [7913390]
- Updated dependencies [514f426]
- Updated dependencies [1394e34]
- Updated dependencies [e95cc25]
- Updated dependencies [abe8ebc]
- Updated dependencies [300d755]
- Updated dependencies [3cc38fe]
- Updated dependencies [bd8b054]
- Updated dependencies [4eb9cb6]
- Updated dependencies [7c239fd]
- Updated dependencies [858ad94]
- Updated dependencies [2270239]
- Updated dependencies [db8cd00]
- Updated dependencies [650bd1f]
- Updated dependencies [2f31406]
- Updated dependencies [18728c1]
- Updated dependencies [8d1195d]
  - @object-ui/core@7.0.0
  - @object-ui/components@7.0.0
  - @object-ui/plugin-detail@7.0.0
  - @object-ui/react@7.0.0
  - @object-ui/i18n@7.0.0
  - @object-ui/types@7.0.0
  - @object-ui/fields@7.0.0

## 6.2.3

### Patch Changes

- @object-ui/types@6.2.3
- @object-ui/core@6.2.3
- @object-ui/i18n@6.2.3
- @object-ui/react@6.2.3
- @object-ui/components@6.2.3
- @object-ui/fields@6.2.3
- @object-ui/plugin-detail@6.2.3

## 6.2.2

### Patch Changes

- Updated dependencies [a66f788]
  - @object-ui/react@6.2.2
  - @object-ui/components@6.2.2
  - @object-ui/fields@6.2.2
  - @object-ui/plugin-detail@6.2.2
  - @object-ui/types@6.2.2
  - @object-ui/core@6.2.2
  - @object-ui/i18n@6.2.2

## 6.2.1

### Patch Changes

- @object-ui/types@6.2.1
- @object-ui/core@6.2.1
- @object-ui/i18n@6.2.1
- @object-ui/react@6.2.1
- @object-ui/components@6.2.1
- @object-ui/fields@6.2.1
- @object-ui/plugin-detail@6.2.1

## 6.2.0

### Patch Changes

- @object-ui/react@6.2.0
- @object-ui/components@6.2.0
- @object-ui/fields@6.2.0
- @object-ui/plugin-detail@6.2.0
- @object-ui/types@6.2.0
- @object-ui/core@6.2.0
- @object-ui/i18n@6.2.0

## 6.1.0

### Patch Changes

- Updated dependencies [991b62d]
  - @object-ui/core@6.1.0
  - @object-ui/types@6.1.0
  - @object-ui/components@6.1.0
  - @object-ui/fields@6.1.0
  - @object-ui/plugin-detail@6.1.0
  - @object-ui/react@6.1.0
  - @object-ui/i18n@6.1.0

## 6.0.4

### Patch Changes

- @object-ui/types@6.0.4
- @object-ui/core@6.0.4
- @object-ui/i18n@6.0.4
- @object-ui/react@6.0.4
- @object-ui/components@6.0.4
- @object-ui/fields@6.0.4
- @object-ui/plugin-detail@6.0.4

## 6.0.3

### Patch Changes

- @object-ui/types@6.0.3
- @object-ui/core@6.0.3
- @object-ui/i18n@6.0.3
- @object-ui/react@6.0.3
- @object-ui/components@6.0.3
- @object-ui/fields@6.0.3
- @object-ui/plugin-detail@6.0.3

## 6.0.2

### Patch Changes

- @object-ui/types@6.0.2
- @object-ui/core@6.0.2
- @object-ui/i18n@6.0.2
- @object-ui/react@6.0.2
- @object-ui/components@6.0.2
- @object-ui/fields@6.0.2
- @object-ui/plugin-detail@6.0.2

## 6.0.1

### Patch Changes

- @object-ui/types@6.0.1
- @object-ui/core@6.0.1
- @object-ui/i18n@6.0.1
- @object-ui/react@6.0.1
- @object-ui/components@6.0.1
- @object-ui/fields@6.0.1
- @object-ui/plugin-detail@6.0.1

## 6.0.0

### Patch Changes

- @object-ui/types@6.0.0
- @object-ui/core@6.0.0
- @object-ui/i18n@6.0.0
- @object-ui/react@6.0.0
- @object-ui/components@6.0.0
- @object-ui/fields@6.0.0
- @object-ui/plugin-detail@6.0.0

## 5.4.2

### Patch Changes

- @object-ui/types@5.4.2
- @object-ui/core@5.4.2
- @object-ui/i18n@5.4.2
- @object-ui/react@5.4.2
- @object-ui/components@5.4.2
- @object-ui/fields@5.4.2
- @object-ui/plugin-detail@5.4.2

## 5.4.1

### Patch Changes

- @object-ui/types@5.4.1
- @object-ui/core@5.4.1
- @object-ui/i18n@5.4.1
- @object-ui/react@5.4.1
- @object-ui/components@5.4.1
- @object-ui/fields@5.4.1
- @object-ui/plugin-detail@5.4.1

## 5.4.0

### Patch Changes

- Updated dependencies [3a8c754]
  - @object-ui/types@5.4.0
  - @object-ui/components@5.4.0
  - @object-ui/core@5.4.0
  - @object-ui/fields@5.4.0
  - @object-ui/plugin-detail@5.4.0
  - @object-ui/react@5.4.0
  - @object-ui/i18n@5.4.0

## 5.3.2

### Patch Changes

- @object-ui/types@5.3.2
- @object-ui/core@5.3.2
- @object-ui/i18n@5.3.2
- @object-ui/react@5.3.2
- @object-ui/components@5.3.2
- @object-ui/fields@5.3.2
- @object-ui/plugin-detail@5.3.2

## 5.3.1

### Patch Changes

- @object-ui/types@5.3.1
- @object-ui/core@5.3.1
- @object-ui/i18n@5.3.1
- @object-ui/react@5.3.1
- @object-ui/components@5.3.1
- @object-ui/fields@5.3.1
- @object-ui/plugin-detail@5.3.1

## 5.3.0

### Patch Changes

- @object-ui/types@5.3.0
- @object-ui/core@5.3.0
- @object-ui/i18n@5.3.0
- @object-ui/react@5.3.0
- @object-ui/components@5.3.0
- @object-ui/fields@5.3.0
- @object-ui/plugin-detail@5.3.0

## 5.2.1

### Patch Changes

- @object-ui/types@5.2.1
- @object-ui/core@5.2.1
- @object-ui/i18n@5.2.1
- @object-ui/react@5.2.1
- @object-ui/components@5.2.1
- @object-ui/fields@5.2.1
- @object-ui/plugin-detail@5.2.1

## 5.2.0

### Minor Changes

- 77a6118: `KanbanBoard` collapses redundant per-column "No cards" placeholders into
  a single board-level empty banner when **every** column is empty and the
  board has more than one column. Individual columns keep their dashed
  placeholder when they're the only empty column (so the asymmetry between
  "this lane has zero cards" and "the whole board is empty" stays
  readable). New internal prop `suppressEmptyPlaceholder` on the column
  view; not part of the public API.

### Patch Changes

- a3cb88f: CRM UX polish batch:
  - Kanban columns: drop the per-column rainbow top stripe. Lane border + header divider are sufficient; cards are now the loudest thing on screen (Linear / HubSpot pattern).
  - Stage chevron (`record:path`): bump completed-stage contrast (emerald-800 text on emerald-500/15, was 700 on /10) and future-stage text from `foreground/70` to `foreground/85` for legibility.
  - i18n: add `notifications.emptyUnread`, `notifications.filterUnread`, `notifications.filterAll` (en + zh) so the InboxPopover Unread/All sub-filter renders in the active locale.
- 5425608: CRM UX polish pass — calmer enterprise look across detail + kanban.

  - **plugin-kanban**: column headers now use a 2px muted accent stripe with
    neutral foreground titles + a quiet grey count pill instead of full
    rainbow gradient + colored title + colored count. Pipeline boards
    (Opportunity, Case, Task, Lead) look like Salesforce/Linear instead of
    a toy. WIP-limit overflow remains destructive-red so urgency stays loud.
  - **plugin-detail (`record:reference_rail`)**: new `hideEmpty` prop
    (default true) collapses entries whose total === 0 into a single
    `+ N empty (Quotes · Products …)` chip at the bottom of the rail.
    Removes the 4–7 "No records" stack that dominated the aside.
  - **plugin-detail (`record:path`)**: completed stages now render with an
    emerald-tinted background + bold green check instead of low-contrast
    `bg-muted text-muted-foreground` (which read as "light grey on white"
    and was borderline unreadable).
  - **app-shell (`RecordDetailView`)**: record-not-found short-circuit.
    Previously a stale/missing recordId still rendered the page chrome
    (rail, discussion, breadcrumb with the raw id), making invalid links
    look like a partially broken page. Now renders a clean centered
    `Empty` state with database icon + i18n'd "Record not found" copy.
  - **i18n**: added `detail.showEmptyRelated_{one,other}` and
    `empty.recordNotFound{,Description}` keys (en + zh).

- d912a60: CRM polish — denser kanban cards, smarter currency, calmer dates.

  - **plugin-kanban card body**: drop the verbose `Label: value` two-column
    grid in favor of a single-column dense list (values only, with the
    field label preserved as a hover `title` for accessibility). Pipeline
    cards across Salesforce / HubSpot / Linear all do this because the
    value's own type carries its meaning, and the saved space lets the
    title breathe.
  - **fields/formatCurrency**: drop trailing `.00` when the value is a
    whole number (Salesforce convention: `$1,234.50` keeps cents,
    `$1,234` doesn't). Pipeline amounts like `500,000.00` now read as
    `500,000`.
  - **fields/formatDate** default branch: drop the year when it matches
    the current year — `7月21日` instead of `2026年7月21日`. Past- and
    future-year dates keep the year for disambiguation
    (`2025年11月23日`).
  - **fields/CurrencyCellRenderer**: removed the now-redundant
    `.replace(/[.,]00$/, '')` workaround that hid cents for `precision:0`
    fields; the formatter now handles whole-unit trimming natively.

- 87bc8ff: `DataEmptyState` (re-exported as `EmptyState`) is now the canonical
  platform primitive for "no records / no data" states. Two new props
  keep it flexible enough to absorb the hand-rolled variants that lived
  in `plugin-list`, `plugin-kanban`, and `plugin-dashboard`:

  - `showIcon?: boolean` — drops the icon container entirely. Used by the
    kanban board-level empty banner, which is a status banner rather than
    a true empty-state.
  - `iconWrapperClassName?: string` — overrides the default muted rounded
    square. Pass `""` to render the icon raw (used by `ListView`'s grid
    empty state, which uses a large standalone glyph).

  Adopters:

  - `plugin-list` (`ListView` grid empty-state) — preserves the existing
    large icon, title, message, add-record button and `data-testid`s,
    but delegates the structural markup to `DataEmptyState`.
  - `plugin-kanban` (board-level "all columns empty" banner) — keeps the
    dashed border + `role="status"` / `aria-live="polite"` semantics.
  - `plugin-dashboard` (`PivotTable` zero-rows branch) — keeps the
    custom 4-quad SVG icon and `pivot-empty-state` test id.

  No public-API change for consumers; the older inline markup is gone
  but the rendered output, translation keys, and test hooks are
  preserved.

- Updated dependencies [de0c5e6]
- Updated dependencies [9997cae]
- Updated dependencies [321294c]
- Updated dependencies [b2d1704]
- Updated dependencies [0a644f0]
- Updated dependencies [a3cb88f]
- Updated dependencies [5425608]
- Updated dependencies [6c3f018]
- Updated dependencies [d912a60]
- Updated dependencies [5633edd]
- Updated dependencies [87bc8ff]
- Updated dependencies [3ebba63]
- Updated dependencies [7c441f5]
- Updated dependencies [e919433]
- Updated dependencies [a8d12ec]
- Updated dependencies [70b5570]
- Updated dependencies [aa063db]
- Updated dependencies [d9c3bae]
- Updated dependencies [3216f8a]
- Updated dependencies [d1442e3]
- Updated dependencies [7c7400a]
  - @object-ui/types@5.2.0
  - @object-ui/core@5.2.0
  - @object-ui/i18n@5.2.0
  - @object-ui/react@5.2.0
  - @object-ui/plugin-detail@5.2.0
  - @object-ui/fields@5.2.0
  - @object-ui/components@5.2.0

## 5.1.1

### Patch Changes

- Updated dependencies [8955b9c]
  - @object-ui/components@5.1.1
  - @object-ui/fields@5.1.1
  - @object-ui/plugin-detail@5.1.1
  - @object-ui/types@5.1.1
  - @object-ui/core@5.1.1
  - @object-ui/i18n@5.1.1
  - @object-ui/react@5.1.1

## 5.1.0

### Patch Changes

- Updated dependencies [bd8447d]
- Updated dependencies [fbd5052]
- Updated dependencies [d51a577]
- Updated dependencies [1976691]
- Updated dependencies [d1ec6a2]
- Updated dependencies [cf30cc2]
- Updated dependencies [32306e8]
- Updated dependencies [5b80cfd]
- Updated dependencies [49b1760]
- Updated dependencies [a49f300]
- Updated dependencies [c0b236f]
- Updated dependencies [8fd863e]
- Updated dependencies [1cb6e21]
- Updated dependencies [d548d6b]
  - @object-ui/components@5.1.0
  - @object-ui/plugin-detail@5.1.0
  - @object-ui/react@5.1.0
  - @object-ui/i18n@5.1.0
  - @object-ui/types@5.1.0
  - @object-ui/core@5.1.0
  - @object-ui/fields@5.1.0

## 5.0.2

### Patch Changes

- Updated dependencies [cab6a93]
  - @object-ui/i18n@5.0.2
  - @object-ui/components@5.0.2
  - @object-ui/fields@5.0.2
  - @object-ui/react@5.0.2
  - @object-ui/plugin-detail@5.0.2
  - @object-ui/types@5.0.2
  - @object-ui/core@5.0.2

## 5.0.1

### Patch Changes

- @object-ui/types@5.0.1
- @object-ui/core@5.0.1
- @object-ui/i18n@5.0.1
- @object-ui/react@5.0.1
- @object-ui/components@5.0.1
- @object-ui/fields@5.0.1
- @object-ui/plugin-detail@5.0.1

## 5.0.0

### Patch Changes

- Updated dependencies [542cca9]
- Updated dependencies [8930b15]
- Updated dependencies [95b6b21]
- Updated dependencies [ddb08a7]
- Updated dependencies [f16a762]
- Updated dependencies [765d50f]
- Updated dependencies [927187a]
- Updated dependencies [bae8ba8]
- Updated dependencies [8435860]
- Updated dependencies [bece8ca]
- Updated dependencies [bb2ea48]
- Updated dependencies [77c1877]
- Updated dependencies [b14fe09]
- Updated dependencies [1911d34]
- Updated dependencies [ba98039]
- Updated dependencies [a7bef6e]
- Updated dependencies [86c04f1]
- Updated dependencies [74962b0]
- Updated dependencies [8b850b5]
- Updated dependencies [3154334]
- Updated dependencies [fa4c2cb]
- Updated dependencies [7213027]
- Updated dependencies [34b66bf]
  - @object-ui/plugin-detail@5.0.0
  - @object-ui/components@5.0.0
  - @object-ui/i18n@5.0.0
  - @object-ui/react@5.0.0
  - @object-ui/types@5.0.0
  - @object-ui/fields@5.0.0
  - @object-ui/core@5.0.0

## 4.8.0

### Minor Changes

- 3a17c8d: Mobile UI: aggressive chrome reduction to match real mobile-app conventions.

  Real mobile CRMs (Salesforce, HubSpot, Notion, Linear) keep one row of
  chrome on phones: title + 1 primary action, plus content. We were
  shipping ~5 rows of toolbars + chips + tabs above the data. This commit
  hides the desktop-only chrome at the `<sm` breakpoint:

  - **ListView**: TabBar (view switcher), UserFilters chip row, quick-filters
    chip row, Sort button, list-scoped Search popover, and the
    (newly-added) mobile-only ViewSettingsPopover gear are all hidden on
    phones. Only the **Filter** icon survives on mobile — paired with the
    global ⌘K top-bar search, that is the entire mobile control surface.
  - **Kanban**: previous commit replaced verbose swipe text with a dot
    indicator; that stands.
  - **ObjectView page header**: the Import (CSV upload) button is hidden
    on mobile — CSV import is a desktop workflow.

  Net effect on a 390px viewport: ListView toolbar collapses from
  ~10 controls (5 chips + 5 icons) to a single Filter icon next to the
  title; the body of the page is reachable without scrolling past 3 rows
  of chrome.

  Desktop and tablet behavior is unchanged.

### Patch Changes

- Updated dependencies [06a4066]
  - @object-ui/plugin-detail@4.8.0
  - @object-ui/types@4.8.0
  - @object-ui/core@4.8.0
  - @object-ui/i18n@4.8.0
  - @object-ui/react@4.8.0
  - @object-ui/components@4.8.0
  - @object-ui/fields@4.8.0

## 4.7.0

### Minor Changes

- 186fb2b: Mobile UI optimization: declutter list & kanban on small screens.
  - **ListView toolbar** now auto-collapses HideFields / Group / Color / Density into a single settings gear at `<sm` breakpoints, even when `compactToolbar` is not enabled. Desktop behavior unchanged.
  - **Kanban board** replaces the verbose "← Swipe to navigate →" caption with a compact dot indicator that tracks which column is currently snapped into view. Hidden when there is only one column.

### Patch Changes

- @object-ui/types@4.7.0
- @object-ui/core@4.7.0
- @object-ui/i18n@4.7.0
- @object-ui/react@4.7.0
- @object-ui/components@4.7.0
- @object-ui/fields@4.7.0
- @object-ui/plugin-detail@4.7.0

## 4.6.0

### Patch Changes

- Updated dependencies [8f490ad]
- Updated dependencies [3ee436d]
  - @object-ui/plugin-detail@4.6.0
  - @object-ui/components@4.6.0
  - @object-ui/fields@4.6.0
  - @object-ui/types@4.6.0
  - @object-ui/core@4.6.0
  - @object-ui/i18n@4.6.0
  - @object-ui/react@4.6.0

## 4.5.0

### Patch Changes

- Updated dependencies [ab5e281]
- Updated dependencies [d714e85]
- Updated dependencies [6b6afd1]
- Updated dependencies [22fa558]
- Updated dependencies [aa7855f]
- Updated dependencies [170d89f]
  - @object-ui/types@4.5.0
  - @object-ui/plugin-detail@4.5.0
  - @object-ui/fields@4.5.0
  - @object-ui/components@4.5.0
  - @object-ui/i18n@4.5.0
  - @object-ui/core@4.5.0
  - @object-ui/react@4.5.0

## 4.4.0

### Patch Changes

- Updated dependencies [63eb66d]
- Updated dependencies [67dabe1]
- Updated dependencies [2bd45af]
- Updated dependencies [e33d575]
  - @object-ui/fields@4.4.0
  - @object-ui/plugin-detail@4.4.0
  - @object-ui/components@4.4.0
  - @object-ui/types@4.4.0
  - @object-ui/core@4.4.0
  - @object-ui/i18n@4.4.0
  - @object-ui/react@4.4.0

## 4.3.1

### Patch Changes

- Updated dependencies [5f4ac6e]
- Updated dependencies [6b683c8]
- Updated dependencies [0d8eb98]
- Updated dependencies [b0bc410]
  - @object-ui/i18n@4.3.1
  - @object-ui/components@4.3.1
  - @object-ui/plugin-detail@4.3.1
  - @object-ui/fields@4.3.1
  - @object-ui/react@4.3.1
  - @object-ui/types@4.3.1
  - @object-ui/core@4.3.1

## 4.3.0

### Patch Changes

- Updated dependencies [f196cf4]
- Updated dependencies [ee1cc96]
- Updated dependencies [0b032be]
- Updated dependencies [115d36a]
- Updated dependencies [4e7bc1b]
- Updated dependencies [8442c05]
  - @object-ui/i18n@4.3.0
  - @object-ui/components@4.3.0
  - @object-ui/fields@4.3.0
  - @object-ui/react@4.3.0
  - @object-ui/plugin-detail@4.3.0
  - @object-ui/types@4.3.0
  - @object-ui/core@4.3.0

## 4.2.1

### Patch Changes

- @object-ui/types@4.2.1
- @object-ui/core@4.2.1
- @object-ui/i18n@4.2.1
- @object-ui/react@4.2.1
- @object-ui/components@4.2.1
- @object-ui/fields@4.2.1
- @object-ui/plugin-detail@4.2.1

## 4.2.0

### Patch Changes

- Updated dependencies [eb738bd]
- Updated dependencies [650392e]
- Updated dependencies [84b4bf1]
  - @object-ui/i18n@4.2.0
  - @object-ui/components@4.2.0
  - @object-ui/fields@4.2.0
  - @object-ui/react@4.2.0
  - @object-ui/plugin-detail@4.2.0
  - @object-ui/types@4.2.0
  - @object-ui/core@4.2.0

## 4.1.0

### Patch Changes

- @object-ui/types@4.1.0
- @object-ui/core@4.1.0
- @object-ui/i18n@4.1.0
- @object-ui/react@4.1.0
- @object-ui/components@4.1.0
- @object-ui/fields@4.1.0
- @object-ui/plugin-detail@4.1.0

## 4.0.12

### Patch Changes

- @object-ui/types@4.0.12
- @object-ui/core@4.0.12
- @object-ui/i18n@4.0.12
- @object-ui/react@4.0.12
- @object-ui/components@4.0.12
- @object-ui/fields@4.0.12
- @object-ui/plugin-detail@4.0.12

## 4.0.11

### Patch Changes

- Updated dependencies [1909bc3]
  - @object-ui/i18n@4.0.11
  - @object-ui/components@4.0.11
  - @object-ui/fields@4.0.11
  - @object-ui/react@4.0.11
  - @object-ui/plugin-detail@4.0.11
  - @object-ui/types@4.0.11
  - @object-ui/core@4.0.11

## 4.0.10

### Patch Changes

- @object-ui/types@4.0.10
- @object-ui/core@4.0.10
- @object-ui/react@4.0.10
- @object-ui/components@4.0.10
- @object-ui/fields@4.0.10
- @object-ui/plugin-detail@4.0.10

## 4.0.9

### Patch Changes

- @object-ui/types@4.0.9
- @object-ui/core@4.0.9
- @object-ui/react@4.0.9
- @object-ui/components@4.0.9
- @object-ui/fields@4.0.9
- @object-ui/plugin-detail@4.0.9

## 4.0.8

### Patch Changes

- @object-ui/components@4.0.8
- @object-ui/react@4.0.8
- @object-ui/plugin-detail@4.0.8
- @object-ui/types@4.0.8
- @object-ui/core@4.0.8

## 4.0.7

### Patch Changes

- 7c9b85c: Fix compatibility with the framework's normalized Expression envelope format.

  `@objectstack/spec` now emits predicate (`visible` / `enabled`) and template
  (`titleFormat`) fields as `{ dialect, source }` envelopes instead of bare
  strings. The previous implementation assumed strings and crashed the record
  detail view (`TypeError: titleFormat.replace is not a function`) and printed
  `Failed to evaluate expression: ${[object Object]}` for every action visibility
  predicate.

  - `@object-ui/core`: `ExpressionEvaluator.evaluate` / `evaluateCondition` now
    unwrap Expression envelopes transparently.
  - `@object-ui/react`: new `toPredicateInput()` helper to safely normalize
    `boolean | string | Expression` predicate inputs into the `${expr}` form
    expected by `useCondition`.
  - `@object-ui/components`: `action-bar`, `action-button`, `action-group`,
    `action-icon`, `action-menu` renderers use `toPredicateInput()` instead of
    template-literal interpolation that produced `${[object Object]}`.
  - `@object-ui/plugin-detail`, `@object-ui/plugin-kanban`,
    `@object-ui/plugin-calendar`, `@object-ui/app-shell`,
    `@object-ui/console`: title-format helpers accept both legacy strings and
    the new `{ source }` envelope.

  All changes are backward-compatible — legacy bare strings continue to work.

- Updated dependencies [7c9b85c]
  - @object-ui/core@4.0.7
  - @object-ui/react@4.0.7
  - @object-ui/components@4.0.7
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
  - @object-ui/types@4.0.6
  - @object-ui/core@4.0.6
  - @object-ui/react@4.0.6

## 4.0.5

### Patch Changes

- 1dc6061: fix(build): inline dynamic imports in library outputs

  Library `vite build --lib` outputs were emitting separate code-split chunks
  (`rolldown-runtime-*.js`, `LookupField-*.js`, etc.) when source files used
  `React.lazy()` / dynamic `import()`. When consumer apps re-bundled these
  multi-file dists, the library's per-chunk rolldown-runtime collided with the
  consumer's own runtime, causing "TypeError: i is not a function" at runtime
  when lazy components tried to register themselves (e.g. TextField in
  `@object-ui/fields` after 4.0.4).

  Adding `output.inlineDynamicImports: true` to all `@object-ui/*` library vite
  configs forces a single `dist/index.js` per package, which lets consumer
  bundlers handle the library as an opaque ESM module without identifier
  mismatches across chunks.

  Affected packages: components, fields, layout, plugin-aggrid, plugin-ai,
  plugin-calendar, plugin-charts, plugin-chatbot, plugin-dashboard,
  plugin-designer, plugin-detail, plugin-editor, plugin-form, plugin-gantt,
  plugin-grid, plugin-kanban, plugin-list, plugin-map, plugin-markdown,
  plugin-report, plugin-timeline, plugin-view, plugin-workflow.

- Updated dependencies [1dc6061]
  - @object-ui/components@4.0.5
  - @object-ui/types@4.0.5
  - @object-ui/core@4.0.5
  - @object-ui/react@4.0.5

## 4.0.4

### Patch Changes

- d2b6ece: fix: externalize all bare imports in library builds

  Library builds (vite lib mode) now externalize every non-relative import instead of bundling third-party CJS dependencies into the published dist. This avoids inlined `require("react")` / `require("react-dom")` calls that cause `Calling \`require\` for "react" in an environment that doesn't expose the \`require\` function` runtime errors when consumer apps re-bundle the published dist.

  Specifically fixes:

  - `@object-ui/plugin-dashboard` no longer inlines `react-grid-layout` (and its transitive `react-draggable` / `react-resizable` CJS bundles). `react-grid-layout` is now declared as a peer dependency so consumers install a single ESM-friendly copy.
  - `@object-ui/components`, `@object-ui/plugin-calendar`, `@object-ui/plugin-charts`, `@object-ui/plugin-designer` no longer inline `react-i18next` / `i18next` / `use-sync-external-store` CJS shims.
  - All plugin packages now use a unified `external: (id) => !/^[./]/.test(id) && !id.startsWith(__dirname)` rule, ensuring future additions of CJS deps are automatically externalized.

- Updated dependencies [d2b6ece]
  - @object-ui/components@4.0.4
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

## 4.0.1

### Patch Changes

- @object-ui/types@4.0.1
- @object-ui/core@4.0.1
- @object-ui/react@4.0.1
- @object-ui/components@4.0.1

## 4.0.0

### Patch Changes

- Updated dependencies
  - @object-ui/types@4.0.0
  - @object-ui/components@4.0.0
  - @object-ui/core@4.0.0
  - @object-ui/react@4.0.0

## 3.4.0

### Patch Changes

- a2d7023: End-user feature batch — forms, designer history, import/export, and PWA offline sync.

  **Forms (`@object-ui/fields`, `@object-ui/providers`)**

  - `FileField`: native `<input capture="environment">` camera capture for mobile devices, plus a uploading-progress indicator driven by `UploadProvider`.
  - `ImageField`: per-image inline crop/rotate via the lazy-loaded `ImageCropperDialog` (canvas-based, zero new deps).
  - New `UploadProvider` in `@object-ui/providers` with pluggable adapters for S3 and Azure Blob (plus the default object-URL adapter for local previews). XHR-based with progress, abort, and retry.
  - `LookupField`: `lookup.dependsOn: string | string[]` to chain dependent lookups (e.g. State depends on Country); the trigger is gated until parent values are present and the OData `$filter` is built automatically.

  **Container-aware widget widths (`@object-ui/components`)**

  - New `useResizeObserver(ref)` hook exposing `{ width, height }` of any element. SSR-safe; reads the initial size via `getBoundingClientRect`.
  - `plugin-gantt` and `plugin-kanban` now react to their container size instead of `window.innerWidth`, so they behave correctly inside split panels and dashboards.

  **Designer history (`@object-ui/plugin-designer`)**

  - `useUndoRedo` (and therefore `useDesignerHistory`) gains `persistKey` + `storage` options to round-trip the undo/redo stack through `sessionStorage`, plus a `clearPersisted()` cleanup helper. Drafts now survive accidental tab refreshes.
  - New `<HistoryPanel>` component renders the timeline visually with one-click jump-to-checkpoint via the new `jumpTo(index)` API.

  **Import wizard (`@object-ui/plugin-grid`)**

  - Saved column-mapping templates: name, save, re-apply, and delete via a new template bar in the mapping step. Persisted under `objectui:import-templates:${objectName}` (override via `templateStorageKey` / `templateStorage`).
  - Inline validation correction: cells with errors in the preview step are now editable; corrections feed straight into the import without requiring a re-upload, with green-bar status indicators for fixed rows.

  **PWA offline sync (`@object-ui/mobile`)**

  - New `MemoryOfflineQueue` / `IndexedDbOfflineQueue` (`createOfflineQueue()` picks the best backend) backed by IndexedDB.
  - `createOfflineDataSource(inner, { queue })` wraps any DataSource so mutations issued while offline (or that fail with a network-style error) are queued and replayed in order on reconnect. Includes `replay()`, `drop()`, `clear()`, `pending()`, an `onChange` notifier, and an opt-in `resolveConflict` hook for stale-write conflicts.
  - New `useOfflineSync(source)` hook exposes `{ isOnline, pending, isReplaying, replay, drop, clear }` and auto-replays on the browser's `online` event.
  - `getServiceWorkerSource(opts)` emits a customisable Service Worker that pre-caches the app shell, applies network-first to API requests, and broadcasts `REPLAY_QUEUE` to clients on Background Sync. `requestBackgroundSync(tag)` registers a one-shot sync from the page.

- b2be122: fix(mobile): round 2 — kanban readability, calendar default view, timeline dot clipping

  **Kanban**

  - Remove `font-mono` from card titles, descriptions, column headers, and empty-state labels — CRM cards no longer render in a monospace font.
  - Constrain column body height (`max-h-full min-h-0` + `h-full` on the layout root) so `ScrollArea` activates and cards don't bleed past the viewport bottom.
  - Opportunistically derive `description` (e.g. `$60K · Acme Corp · @owner`) and up to two `badges` (priority/severity/industry/rating) in `ObjectKanban` when the schema/source omits them, giving mobile cards more context at a glance.

  **Calendar**

  - `ObjectCalendar` previously hardcoded `view={schema.defaultView ?? 'month'}`, making the view-selector dropdown a no-op. Wire the `view` state through to the `<Calendar>` prop so user selection is respected.
  - On mobile (viewport < 768 px) coerce `day` defaults to `month` via a synchronous lazy initialiser and a resize/orientation effect — avoids the useless 24-hour empty-hour grid for date-only events.

  **Timeline**

  - Add `ml-3` to the `<Timeline>` `<ol>` so the `absolute -left-3` marker dots are no longer clipped at the scroll-container edge.

- Updated dependencies [a2d7023]
- Updated dependencies [f1ca238]
- Updated dependencies [de881ef]
  - @object-ui/components@3.4.0
  - @object-ui/types@3.4.0
  - @object-ui/core@3.4.0
  - @object-ui/react@3.4.0

## 3.3.2

### Patch Changes

- @object-ui/types@3.3.2
- @object-ui/core@3.3.2
- @object-ui/react@3.3.2
- @object-ui/components@3.3.2

## 3.3.1

### Patch Changes

- Updated dependencies [b429568]
  - @object-ui/components@3.3.1
  - @object-ui/types@3.3.1
  - @object-ui/core@3.3.1
  - @object-ui/react@3.3.1

## 3.3.0

### Patch Changes

- @object-ui/types@3.3.0
- @object-ui/core@3.3.0
- @object-ui/react@3.3.0
- @object-ui/components@3.3.0

## 3.2.0

### Patch Changes

- @object-ui/types@3.2.0
- @object-ui/core@3.2.0
- @object-ui/react@3.2.0
- @object-ui/components@3.2.0

## 3.1.5

### Patch Changes

- @object-ui/react@3.1.5
- @object-ui/components@3.1.5
- @object-ui/types@3.1.5
- @object-ui/core@3.1.5

## 3.1.4

### Patch Changes

- @object-ui/types@3.1.4
- @object-ui/core@3.1.4
- @object-ui/react@3.1.4
- @object-ui/components@3.1.4

## 3.1.3

### Patch Changes

- @object-ui/types@3.1.3
- @object-ui/core@3.1.3
- @object-ui/react@3.1.3
- @object-ui/components@3.1.3

## 3.1.2

### Patch Changes

- @object-ui/types@3.1.2
- @object-ui/core@3.1.2
- @object-ui/react@3.1.2
- @object-ui/components@3.1.2

## 3.1.1

### Patch Changes

- Updated dependencies
  - @object-ui/types@3.1.1
  - @object-ui/components@3.1.1
  - @object-ui/core@3.1.1
  - @object-ui/react@3.1.1

## 3.0.3

### Patch Changes

- @object-ui/types@3.0.3
- @object-ui/core@3.0.3
- @object-ui/react@3.0.3
- @object-ui/components@3.0.3

## 3.0.2

### Patch Changes

- @object-ui/types@3.0.2
- @object-ui/core@3.0.2
- @object-ui/react@3.0.2
- @object-ui/components@3.0.2

## 3.0.1

### Patch Changes

- Updated dependencies [adf2cc0]
  - @object-ui/react@3.0.1
  - @object-ui/components@3.0.1
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

## 2.0.0

### Major Changes

- b859617: Release v1.0.0 — unify all package versions to 1.0.0

### Patch Changes

- Updated dependencies [b859617]
  - @object-ui/types@2.0.0
  - @object-ui/core@2.0.0
  - @object-ui/react@2.0.0
  - @object-ui/components@2.0.0

## 0.3.1

### Patch Changes

- Maintenance release - Documentation and build improvements
- Updated dependencies
  - @object-ui/types@0.3.1
  - @object-ui/core@0.3.1
  - @object-ui/react@0.3.1
  - @object-ui/components@0.3.1

## 0.3.0

### Minor Changes

- Unified version across all packages to 0.3.0 for consistent versioning

## 0.2.2

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

## 0.2.1

### Patch Changes

- Patch release: Add automated changeset workflow and CI/CD improvements

  This release includes infrastructure improvements:

  - Added changeset-based version management
  - Enhanced CI/CD workflows with GitHub Actions
  - Improved documentation for contributing and releasing

- Updated dependencies
  - @object-ui/types@0.2.1
  - @object-ui/core@0.2.1
  - @object-ui/react@0.2.1
  - @object-ui/components@0.2.1
