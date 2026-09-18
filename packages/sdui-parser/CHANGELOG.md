# @object-ui/sdui-parser

## 17.7.0

### Minor Changes

- 0db4fb3: html tier: a braced attribute value that is not strict JSON now draws a `inert-expression` warning instead of vanishing silently (objectui#6598)
  
  `interpretBrace` materializes strict-JSON values only; anything else — the
  single-quoted array every JSX author writes (`columns={['name','amount']}`),
  unquoted object keys, any JS expression — compiles to the deferred `{ $expr }`
  marker, and nothing downstream evaluates that marker: the html tier parses,
  never executes (ADR-0080), and no renderer consumes `$expr`. The value reached
  the renderer as an opaque object, defensive non-array/non-object reads degraded
  it to "not declared", and the author's binding vanished with zero diagnostics
  anywhere — a production page's `list-view` rendered its row count and toolbar
  with no data columns, through eight `columns` spellings (objectui#6598, moved
  from objectstack#12649). That is ADR-0078's prohibited parsed-but-silently-inert
  state.
  
  `validateTree` now emits a warning-severity `inert-expression` diagnostic when a
  declared input's value is the `$expr` marker, with the fix in the message: write
  the value as JSON (double-quoted strings and keys). Warning, not error, per the
  objectui#5709 posture for inert authored keys — pages keep compiling and
  rendering exactly as before; the silence is what changed. Escalating the
  severity, widening the accepted literal grammar (e.g. materializing
  single-quoted strings), and covering base props like `style` are contract
  decisions deliberately left on objectui#6598.
- 4703651: html tier: braced attribute values now materialize the JS literal subset — single-quoted strings and unquoted identifier keys work (objectui#6614)
  
  The html tier is the untrusted-safe DATA tier: source is parsed, never executed
  (ADR-0080), which makes it the only safe carrier for runtime AI- or
  tenant-authored pages. But `interpretBrace` accepted only strict JSON inside
  braces while the surface called itself JSX, so `columns={['name','amount']}` —
  the spelling every JSX author and every AI author writes by habit — compiled to
  the deferred `{ $expr }` marker that nothing downstream evaluates, and the
  author's whole data binding vanished at render. A production page's `list-view`
  rendered its row count and toolbar with zero data columns through eight
  `columns` spellings before the author gave up (objectui#6598, moved from
  objectstack#12649). That was a trap, not a contract.
  
  `interpretBrace` now materializes the JS **literal subset**. Exactly two
  widenings over JSON, and nothing else:
  
  1. **single-quoted strings**, in value position and in key position —
     `title={'Accounts'}`, `columns={['name','amount']}`, `{{'pageSize': 25}}`;
  2. **unquoted identifier object keys** — `options={{pageSize: 25}}`,
     `columns={[{field:'name',label:'Full Name'}]}`.
  
  Everything else JSON refuses is still refused, still compiles to `{ $expr }`,
  and still draws the warning-severity `inert-expression` diagnostic: trailing
  commas, comments, array holes, spreads, `undefined`/`NaN`/`Infinity`,
  `+1`/`.5`/`1.`/`0x1f`, template literals, and every genuine expression —
  identifiers, member access, calls, operators, ternaries. The subset contains no
  identifier lookup and no operator, so there is nothing in it to execute: this
  moves habitual spellings onto the materialized side, it does not move the
  boundary between data and code. An authored `__proto__` key becomes an ordinary
  own property, as `JSON.parse` gives it — never the prototype setter.
  
  Strict JSON is unchanged, structurally: `JSON.parse` still runs first and
  untouched, so any value it accepts takes byte-identically the path it always
  did, and the literal reader only ever sees input `JSON.parse` has already
  thrown on.
  
  The `inert-expression` message changed with the grammar. It used to advise
  "write it as JSON (double-quoted strings and keys)" and named
  `columns={['name','amount']}` as the wrong form — advice that would now send an
  author to edit working source. It names the accepted literal grammar instead.
  
  Maintainer ruling of 2026-08-28 (objectui#6614 Q1-A). ⛔ Two ruled items are
  deliberately NOT in this change: escalating `inert-expression` from warning to
  error (Q2 — it belongs at the save gate, once the framework wires the registry
  manifest into `validate-jsx-pages`), and base-prop (`style`) `$expr` inertness
  (Q3 — sequenced after this, so no warning is added for spellings this change
  legalises).
- 9e37d9b: `binding` on a component input is framework-set, not author-declared: `@object-ui/types` gains `InjectedComponentInput`, the `'field'` binding arm is retired from `@object-ui/sdui-parser`'s `RegistryConfigLike`, and the `as ComponentMeta` cast at the injection seam in `@object-ui/core` is gone (objectui#6950; maintainer ruling of 2026-09-07, director decision batch #69; ADR-0049 enforce-or-remove).
  
  **What was measured.** `binding` was published — the manifest serializer forwards it — and read — `validateTree` records a binding site for it — while `ComponentInput`, the authoring type every registration writes against, did not declare it. The one writer in the tree, `ELEMENT_DATA_SOURCE_INPUT`, therefore carried a hand-written inline type and reached a registration's `inputs` through `as ComponentMeta` in `Registry.register`. Declared narrower than enforced, on a published type — and `ComponentInput`'s own docblock listed `binding` among the forwarded per-input keys.
  
  **The ruling** answered the product question the card asked — may an ordinary registration declare a binding input? — with no. So:
  
  - **`@object-ui/types`** exports `InjectedComponentInput`, an `interface … extends ComponentInput` with the required marker `binding: 'object'`. `ComponentInput` itself does not change: no member is added, and authoring `binding` on a registration stays an excess-property `tsc` error — now on purpose and documented at the interface. The two tombstone docblocks that listed `binding` as a forwarded key now say it is forwarded from the framework's injected input, not authored.
  - **`@object-ui/core`** types `ELEMENT_DATA_SOURCE_INPUT` as `InjectedComponentInput` and splices it through a typed local; the cast is gone. Runtime behaviour is unchanged — the same key, `type`, `binding` and `description` reach the manifest, and `validateTree` still records the binding site.
  - **`@object-ui/sdui-parser`** narrows `RegistryConfigLike.inputs[].binding` from `'object' | 'field'` to `'object'`. The `'field'` arm had zero writers — every `binding:` literal in `packages/`, `apps/` and `examples/` is `'object'`, 7 of 7 at this change's merge-base — and nothing on either side of the manifest resolved a field binding. **Breaking, deliberately:** a config that feeds `manifestFromConfigs` a `binding: 'field'` input is now a type error instead of a manifest entry the server would never resolve. `ManifestInput.binding`, the manifest reader's vocabulary, is not narrowed by this change.
  
  If a real need for author-declared bindings is ever measured, it is filed as a widening of `ComponentInput` with the vocabulary decided then — not by putting the cast back.
- 492bbd8: Refuse an authored `type=` attribute on the `kind:'html'` tier (objectui#7235 — the
  port of objectstack#13957, maintainer ruling 2026-09-01, recorded as an append-only
  amendment on ADR-0080).
  
  **Breaking, deliberately, and the direction is a narrowing.** On this tier the tag
  name *is* the node's `type`, so an authored `type=` attribute is a name collision
  with the envelope's own discriminator. It is now one `forbidden-attr` error naming
  both the tag and the attribute, and the node is composed as `{ ...props, type: tag }`
  so the tag always wins the slot.
  
  Two outcomes it replaces, the first of which produced no diagnostic at all:
  
  - the value named another **registered** type (`<flex type="grid">`) — the tree
    carried `type:'grid'`, the manifest resolved it, every check passed, and a grid
    rendered where the author wrote a flex. Zero diagnostics.
  - the value named **nothing registered** (`<object-chart type="bar">`) — loud, but
    `unknown-component` naming `"bar"` read as a missing plugin rather than as an
    attribute that should not be there.
  
  The existing `forbidden-attr` code is reused rather than a new one minted: the two
  copies of this parser (this one, which the renderer and the console's live edit
  preview run, and objectstack's, which the save gate runs) are held to one diagnostic
  vocabulary by `check:sdui-lockstep`, and a code minted on one side only is the dialect
  split that gate exists to catch.
  
  ⚠️ Not carried over: the react tier's `specType` rescue (objectui#2880). The ruling
  declined it by name; that rescue stays where it lives.
  
  One visible non-behavioural consequence of the reversed spread: a compiled node's
  `type` key is now **last** rather than first in insertion order, so `JSON.stringify`
  of a parsed tree emits the same pairs in a different order. The key set, every value,
  the children and the html-tier provenance marker are unchanged.
- cf1d29e: `ComponentInput.of` — the coarse kind of an input's MEMBERS, with readers on day one
  (objectui#8067).
  
  A registration's `type: 'array'` said a value was a list and stopped there, so a member
  that drifted from `@objectstack/spec` was invisible to every layer that reads a
  declaration. `page:header.actions` is the measured cost: the contract declares
  `z.array(z.string())` ("Action IDs"), the renderer read the members as `ActionDef`
  objects, and the repo-wide parity gate in
  `apps/console/src/__tests__/registry-inputs-spec-parity.test.ts` stayed green for the
  whole life of the drift because both sides carried the key and neither could say what
  was inside it. What settled it was a maintainer ruling, not a test — and even after the
  fix, "these are ids" survived only as English in the registration's `description`.
  
  **What is new.** `ComponentInput` gains an optional `of`, carrying the same coarse-kind
  vocabulary as `type` one level down: the ELEMENTS of an `array`, or the VALUES of an
  `object` used as a map. One kind, or an array of them for a member contract that is a
  union, with `type`'s semantics — a member passes when any declared arm accepts it. The
  manifest serializer forwards it, so `sdui.manifest.json` now carries seven keys per
  input instead of six.
  
  **Three readers ship with it**, which was the bar this slot had to clear (objectui#5905
  is the precedent: five `ComponentInput` keys declared and read by nothing). The
  repo-wide parity gate compares every declared `of` against the member kind
  `ComponentPropsMap[type]` actually accepts and fails on one the contract refuses;
  `sdui-parser`'s `validateTree` reports a member that fits no declared kind, as a new
  `member-type-mismatch` diagnostic naming the offending positions; and the generated
  `sdui-intrinsics.d.ts` narrows the authoring type — `page:header`'s `actions` is
  `string[]` where it used to be `unknown[]`.
  
  **Fifteen keys now declare one**, across ten blocks, each DERIVED rather than chosen:
  every container key's member position was probed with one value of each coarse kind and
  a declaration written only where exactly one kind was accepted. A member contract that
  admits several kinds — `record:highlights.fields` takes a field name or an inline field
  object — is deliberately left undeclared and pinned with its reason, because picking one
  arm there is a narrowing this repo leaves un-gated and picking all of them would
  advertise shapes only a per-block pin can vouch for.
  
  **The ceiling is unchanged.** `of` is a KIND and never a value domain, so the maintainer
  ruling of 2026-08-17 quoted on `ComponentInput.type` — the coarse arm plus `description`
  is the publication face's expression ceiling, and spec is the sole judge of values —
  stands exactly as written. `of: 'object'` says the members are objects; which keys they
  carry is still `description`'s job and `os validate`'s.
  
  **Nothing published before this changes.** An input that declares no `of` validates,
  serializes and types byte-identically: `validateTree` checks no member, the serializer
  emits no key, and the codegen emits the same `unknown[]`.
- 80cb063: html tier: name the inert `quickAdd` on `object-kanban` / `kanban` instead of calling it unknown
  
  The Quick Add control is gated on BOTH `quickAdd` and an `onQuickAdd` handler, and
  `onQuickAdd` is a runtime slot — a function — that no parsed page can write and that
  `ObjectKanban` supplies none of its own for. So an authored `quickAdd: true` on either
  `ObjectKanbanRenderer` tag has never produced a control.
  
  Until now the only thing the tier said about it was `unknown-prop`, "has no prop
  quickAdd" — false against `@objectstack/spec`, which publishes the key, and
  indistinguishable from a typo. It now draws an `inert-quick-add` **warning** that names
  the missing half of the pair and points at `kanban-ui`, where a React host can supply
  the function. Severity is unchanged (warning, as `unknown-prop` was), so no page that
  saves today stops saving.
  
  New exports: `checkKanbanQuickAdd`, `INERT_QUICK_ADD`, `QUICK_ADD_HOST_TYPES`,
  `QUICK_ADD_KEY`.
  
  Interim by ruling (objectui#8285, decision batch #91): the contract-side refusal is
  retiring `object-kanban.quickAdd` from the spec's `ComponentPropsMap`, and this
  diagnostic is removed by the change that lands it. `kanban-ui` keeps the
  `quickAdd` / `onQuickAdd` pair untouched.
- 483b794: Retire the `binding: 'field'` arm on the manifest READER and PRODUCER faces, so
  `@object-ui/sdui-parser` states one vocabulary instead of two (objectui#8315).
  
  The 2026-09-07 maintainer ruling on objectui#6950 (director decision batch #69)
  retired the zero-writer `'field'` arm under ADR-0049 enforce-or-remove, naming
  **one** coordinate: `RegistryConfigLike.inputs[].binding`, the serializer's input
  boundary, which PR #8297 narrowed. Two declarations in `types.ts` kept the arm, so
  the published package narrowed on one face and stayed wide on the other:
  
  - `ManifestInput.binding` — now `'object'`
  - `ManifestValidationResult.bindings[].kind` — now `'object'`
  
  **Breaking for TypeScript consumers, deliberately, and compile-time only.** A
  hand-written `Manifest` literal or a `bindings[]` entry that spells `'field'` is now
  a `tsc` error. Runtime behaviour is unchanged: types are erased, this package has no
  runtime validator for a manifest it is handed, and `validateTree` still forwards
  whatever a manifest says — a pin in
  `src/__tests__/injected-component-input-6950.test.ts` states that limit so the
  narrowing is not mistaken for a runtime rejection.
  
  **Migration.** Nothing measured has to change. `binding: 'field'` has zero writers in
  this repo and zero in the objectstack copy of this package (measured 2026-09-09 on
  both heads, each with a firing `binding: 'object'` control), and the only manifest
  producer in either tree is `manifestFromConfigs`, whose input face was already narrow.
  Every `binding: 'field'` spelling left under `packages/`, `apps/` and `examples/` is
  an `@ts-expect-error` negative pin asserting the refusal, or a docblock mention of
  the retirement — not a writer.
  
  **Why not leave the reader face wide.** The counter-argument — producer → reader is a
  subset relation, so a permissive reader is not wrong — was answered rather than assumed
  away. `ManifestInput` is not a pure reader face (`manifestFromConfigs` returns it), and
  `bindings[].kind` is a pure **producer** face where the relation inverts: a wider union
  there accepts nothing extra, it obliges every consumer to handle an arm this package
  cannot emit. The two are coupled by `validateTree`'s `kind: input.binding` assignment,
  so narrowing one alone would need a cast at the only conversion site — the lenient
  fallback AGENTS.md #0.1 bans. The reasoning now lives on the declarations themselves,
  where a later reader lands. The reopen route is the ruling's own: a measured need for
  field bindings is filed as a widening with the vocabulary decided then.
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
- 8d58f46: `validateTree` now reports a dashboard widget `options` key that no renderer
  consumes as a `unconsumed-widget-option` **warning** naming the consumed set
  (objectui#5709 ruling). The census behind the accepted set — the spec's five
  declared query keys (`dateGranularity`, `sortBy`, `sortOrder`, `limit`,
  `stageOrder`) plus the `description` sub-caption convention key — is
  re-measured on every test run against `@objectstack/spec` and the
  `plugin-dashboard` renderer sources. The check fires only on dataset-bound
  shorthand widgets (the spec-legal form) hosted by `dashboard` /
  `dashboard-grid` nodes, and honours the spec's per-widget
  `suppressWarnings: ['unconsumed-widget-option']` escape hatch. Warning
  severity only: documents keep parsing, saving and rendering. Exported for
  other surfaces: `checkDashboardWidgetOptions`, `CONSUMED_WIDGET_OPTION_KEYS`,
  `DASHBOARD_WIDGET_HOST_TYPES`, `UNCONSUMED_WIDGET_OPTION`.

### Patch Changes

- faf5269: A dataset-bound KPI tile now renders the sub-caption its author declared in
  `options.description` (objectui#7293).
  
  The sub-caption slot was wired end to end and consumed by nothing. It has its own
  translation key (`{ns}.dashboards.{dash}.widgets.{id}.subCaption`), the server's
  `translateDashboard` overlays that translation onto `options.description`, and
  `DashboardRenderer`'s `tWidgetSubCaption` resolves it — but only onto the two
  inline arms of `getComponentSchema()`. `dataset` is REQUIRED on
  `DashboardWidgetSchema` (published `@objectstack/spec@17.4.0`: the required keys
  are exactly `id` / `dataset` / `values`), so every spec-legal widget renders
  through `DatasetWidget` instead, which read the key nowhere. Every author who
  wrote a sub-caption got silence.
  
  `DatasetWidget`'s metric branch now reads the key and renders it in the caption
  row, resolving it through the same `pickLocalized` seam every other authored
  label channel uses, so an inline per-locale map resolves instead of being
  dropped. A tile that declares no sub-caption renders byte-identical markup.
  
  Read in `DatasetWidget` rather than passed down as a prop on purpose: both
  dashboard surfaces (`DashboardRenderer` and `DashboardGridLayout`) route a
  dataset-bound widget to that one component, so a prop from one dispatch site
  would have fixed one surface and left the other unchanged.
  
  `@object-ui/sdui-parser` carries no behaviour change — its `unconsumed-widget-option`
  census recorded `description` as accepted *despite* having no read site on the
  dataset-bound path, and that note is now stale prose.
- 0b1326d: Documentation no longer teaches the "JSX/HTML + Tailwind" framing for a page's
  `source`, which ADR-0080's own 2026-06-30 header amendment (under ADR-0065,
  Accepted) retracted. objectui#5461 corrected three sites; a multiline census
  found eight more, in three spellings a line-oriented grep could not see.
  
  A page's `source` is *runtime metadata*. The console's Tailwind is compiled at
  build time by scanning the console's own `src`, and there is no safelist, so it
  never sees your page: an authored utility class produces CSS only by coincidence
  (when objectui already ships that exact class) and otherwise produces nothing,
  with no error anywhere. That is the ADR-0065 "works only by coincidence" failure
  mode, and it is how a modal's `bg-black/50` backdrop reached production fully
  transparent. `os validate` reports it as `page-source-className-tailwind`, a
  warning on kinds `html`, `react` and `jsx`, shipped in `@objectstack/lint@11.5.0`.
  
  The tiers themselves are unchanged and every load-bearing claim survives —
  parse-never-execute, the untrusted-author safety argument for `html`, and the
  deprecated `'jsx'` alias. Only the styling primitive is corrected, to the wording
  `content/docs/guide/react-pages.md` §Styling already uses:
  
  | `kind` | Style with |
  |---|---|
  | `"html"` | The blocks' own structured props (`` `<flex direction gap>` ``, `` `<grid columns>` ``) plus a JSON `style` object. |
  | `"react"` | Inline `style` objects. |
  
  Colors on both tiers come from the theme as `hsl(var(--token))`.
  
  Why each package has an entry — each was measured against its built artefact, not
  assumed:
  
  - **`@object-ui/react-runtime`**: `README.md` is published to npm (npm includes
    `README.md` in the tarball regardless of `files`). Its "no sandbox" callout is
    the paragraph that routes untrusted-author work to the `html` tier, and it
    carried the retracted framing line-wrapped across `:17-18`. It also gains the
    §Styling section it was missing — the absence is why the framing survived here.
  - **`@object-ui/sdui-parser`**: the corrected header of `src/types.ts` projects
    verbatim into the published `dist/types.d.ts`.
  - **`@object-ui/components`**: the corrected header of
    `src/renderers/basic/html-elements.tsx` projects verbatim into the published
    `dist/renderers/basic/html-elements.d.ts`. The `kind === 'html'` dispatch-arm
    comment in `src/renderers/layout/page.tsx` does **not** project (it is inside a
    function body) and is included here only because the same package already owes
    an entry.
  
  No behaviour change: this is prose only. `CHANGELOG.md` occurrences are
  deliberately untouched — immutable release history.
- 305205a: `kind:'html'` page sources keep the space between a text run and an adjacent
  inline element: `A <strong>x</strong> page` now compiles to `A `/`<strong>`/`
  page` and renders as `A x page` rather than `Axpage` (objectui#5661).
  
  The parser collapsed each text run's whitespace to a single space — correct, and
  what HTML itself does — and then `.trim()`ed it, which is not: HTML collapses a
  whitespace run to one space, it does not delete it. The deleted space was
  precisely the separator between a run and its inline sibling, so every authored
  sentence carrying emphasis or a link in the tier the guide recommends by default
  rendered with its words run together. It was silent: the page rendered, the
  structure was right, no diagnostic fired.
  
  The rule is deliberately mechanical rather than a block/inline taxonomy invented
  for a schema tree that has none: keep one leading space when a sibling precedes
  the run, and one trailing space when a sibling element follows it. The parent's
  own start and end still drop their edge space, so `<p>  hi  </p>` is unchanged.
  
  Its one bounded cost: a whitespace-only run BETWEEN two siblings survives as a
  single space, so a pretty-printed `<ul>` gains one `' '` string child per gap
  between its `<li>`s — one space per gap, never the source's newline and
  indentation, never at the container's own edges, and never inside an item's own
  text. That bound is pinned by a test rather than left as a claim.

## 17.6.0

### Minor Changes

- 279fb13: `ComponentInput.type` can declare a UNION, so a block stops warning about legal
  writes its own description recommends
  
  A registration's `type` was one coarse control kind, while a good number of spec
  keys accept more than one shape. A declaration therefore had to pick an arm, and
  the repo's own manifest gate then reported `type-mismatch` on the other arm's
  legal values. Four of the five measured cases were the loud shape: the input's
  `description` teaches the author to write an inline translation map
  (`{ en, "zh-CN", … }`) while the same input's `type: 'string'` made
  `sdui-parser`'s `checkType` warn about exactly that map — one platform authority
  contradicting itself on the write it had just recommended. Because these land at
  warning severity the page still compiled and rendered; the cost is that noise on
  correct authoring trains authors, AI authors included, to dismiss the
  `unknown-prop` and `type-mismatch` reports that are real.
  
  `type` now accepts an ARRAY of coarse kinds as well as a single one (maintainer
  ruling on objectui#3832, direction (a)), and a value passes the coarse check when
  ANY declared arm accepts it. Both declaration sites in `@object-ui/types` move
  together with the registry's own copy in `@object-ui/core`, and
  `ComponentInputSchema` enforces the same widening — a non-empty array of
  DISTINCT kinds, so an empty arm list or a repeated arm is refused at authoring
  time rather than normalized behind the author's back.
  
  Five declarations now spell their real contract, and the `type-mismatch` warning
  on each of these legal writes is gone:
  
  - `page:header.title`, `page:header.subtitle`, `page:card.title` —
    string **or** inline translation map (the spec's union, measured against
    `ComponentPropsMap` at the pinned rc.6; the renderers resolve both through
    `pickLocalized`);
  - `record:alert.title`, `record:alert.body` — the same two shapes, justified
    against the RENDERER since the pinned spec carries no `record:alert` props
    schema;
  - `element:text_input.defaultValue` — `string | number`, the spec's union,
    which had been narrowed to `'string'` with the number arm named only in prose.
  
  **Backward compatible, and measured as such.** The single-kind form stays valid
  and is still the canonical spelling for a one-arm key: it validates identically
  (the diagnostics for one arm, `invalid-enum` and its `error` severity included,
  are byte-identical), and `manifestFromConfigs` collapses a one-element array back
  to the bare string, so every entry already in a published `sdui.manifest.json`
  serializes unchanged and arrays appear only where a union was really declared.
  The JSX authoring surface follows in the same step — `generateDts` emits a
  TypeScript union for a union input, so the `.d.ts` an author type-checks against
  accepts exactly what the gate accepts.
  
  A union widens what is legal; it does not switch the check off. A value matching
  NO declared arm is still reported, a multi-arm mismatch reports at its strictest
  arm's severity (`error` when an `enum` arm is present, so an enum's closed list
  does not become dismissible by having a second arm added next to it), and arms
  are meant to match the contract rather than relax the gate:
  `element:text_input.defaultValue` deliberately gains no `object` arm because the
  spec rejects a map there, and `element:record_picker.emptyText` keeps its single
  `'string'` arm because that renderer drops the map form (objectui#4163) — an arm
  the renderer never honours would advertise a shape that cannot reach the screen.

### Patch Changes

- 40d3a33: `div` 的废弃提示按 provenance 收窄:只对 **JSON 作者面**的节点报,不再对 `kind:'html'` tier 自己解析出的节点开火。
  
  html tier 的页面是一段受限 JSX/Tailwind 文本,由引擎自己的解析器编译(只解析、不执行),标签名原样映射成节点 —— 作者在那一层写下的盒子标签,是该 tier 词表里的一等成员,**没有别的拼法可迁移**。提示照旧对他们开火,给的还是 JSON 作者面的替代建议:一条谁都无法执行的提示不是废弃,是噪声;它同时意味着这个类型永远退不掉,因为引擎自己的编译器一直在产出它。
  
  判据是**来源**,由生产者确立:解析器给它产出的每个节点打一个 symbol 标记(`Symbol.for` 注册键),渲染器读这个标记。symbol 对 `JSON.stringify` / `Object.keys` / DOM 全部不可见 —— 所以它既不会落进被持久化的文档,也就无法被一份(手写或 AI 生成的)JSON 元数据复制回来给自己买到豁免;通过花括号属性夹带进来的 JSON **不打标记**,那部分本来就是手写的,建议对它成立。
  
  迁移建议一字未改,JSON 作者面照旧每次模块加载报一次;提示文案现在写明它针对哪一个作者面。

## 17.5.0

## 17.4.0

## 17.3.0

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

- cc70b8f: A declared `objectName` must reach the data layer — the evidence the framework's spec↔registry check cannot gather (objectstack#4472).

  The framework diffs `sdui.manifest.json` against the spec's zod schemas and, while that
  check was named `check:react-conformance`, it was read — by its own file header — as
  confirming these components "ACTUALLY implement" the spec's props. It never could. Both
  sides of that diff are **declarations**, and this repo produces one of them:
  `manifestFromConfigs` copies `config.inputs` verbatim and cannot observe whether the
  renderer behind a block reads any of them. So a prop both sides declare and nothing
  consumes reads there as agreement — which is how objectstack#4413's four `record:*` blocks
  published an `objectName`/`recordId` no renderer read, rendered blank, and stayed green.

  Evidence about the render path has to be taken from the render path, so it lives here now.
  `apps/console/src/__tests__/public-block-binding-reach.test.tsx` mounts every public block
  that declares an `objectName` input through `SchemaRenderer` with nothing but that binding,
  under a provider whose `dataSource` is a Proxy recording every call, and asserts some call
  carried the object name. Deliberately narrow — "is this binding wired", not "is every
  declared input consumed", which is not decidable from outside without heuristics. Every
  non-reaching block carries a written reason in a ledger asserted to equal the observed set
  in **both** directions, so a block that starts binding forces its entry deleted and a block
  that stops binding fails; the suite was verified to go red both ways.

  First run: five of eight bound blocks reach the data layer, three do not.
  `record:related_list` legitimately declines to fetch without the parent record id from
  `RecordContext` (already documented in @objectstack/spec's objectstack#4413 ledger).
  `list-view` and `embeddable-form` do not, and that is a real defect of the same shape —
  neither registration bridges the schema-renderer context onto the component's `dataSource`
  prop the way `object-form` / `object-kanban` / `object-calendar` do, and `SchemaRenderer`
  never injects it, so on the registry/SDUI path both render an empty shell while declaring
  `objectName` **required**. Filed as objectui#3144 rather than fixed here: giving them a
  data source changes what they render everywhere they are mounted bare.

  `manifestFromConfigs` and `scripts/dump-public-manifest.mjs` now say in their own docs that
  what they emit is what a registration _declared_, never what a renderer reads.

## 17.1.0

### Minor Changes

- 32462dd: feat(sdui): guard the public contract against silent drift — coverage test + manifest lazy-stub assertion

  Follow-up to objectui#2953. That bug — every lazily-registered public block
  missing from the contract, and so from every `kind:'react'` page's scope —
  survived because nothing compared `PUBLIC_BLOCKS` against what an app actually
  registers. Type-check, lint, build and the whole suite stayed green while seven
  curated blocks were unusable. Two guards close that class.

  **Console ↔ contract coverage.** `apps/console/src/register-plugins.ts` extracts
  the plugin registration out of `main.tsx` so it can be imported without booting
  the app. A new `apps/console/src/__tests__/public-contract.test.ts` reads that
  real list and pins, as exact lists, which curated tags the console exposes (35),
  which are still unimplemented (`line_items`), and which reach the contract
  through a pending lazy stub. Exact lists rather than `toContain`, because the
  failure mode is a _shrinking_ contract. Reverting the #2953 fix drops coverage
  from 35 to 28 and fails all four assertions.

  **Manifests must be generated from loaded registrations.** New exported
  `assertFullyLoaded(configs)` in `@object-ui/sdui-parser`, plus `lazy?: boolean`
  on `RegistryConfigLike`. A lazy stub carries metadata but no `inputs`, so it
  would be written into `sdui.manifest.json` as a block that takes no props —
  making every prop an author passes it an `unknown-prop` diagnostic in the save
  gate. Both generators now assert instead: `gen-manifest.ts` throws, and
  `dev/manifest-dump.tsx` also imports the console's real registration list, so a
  plugin the console lazy-registers but the dump forgets to import eagerly is
  caught rather than silently emitted propless. `scripts/dump-public-manifest.mjs`
  surfaces that failure instead of timing out for 120s with no message.

  Also documents `object-chart` as a seventh block affected by objectui#2953 —
  the issue listed six.

## 17.0.0

## 16.1.0

## 16.0.0

## 15.0.0

## 14.1.0

## 14.0.0

## 13.2.0

## 13.1.0

## 13.0.0

## 12.1.0

## 12.0.0

## 11.5.0

## 11.4.0

## 11.3.0

## 11.2.0

### Minor Changes

- 9e7a986: ADR-0080: AI-authored UI pages. New `@object-ui/sdui-parser` compiles a constrained JSX/HTML+Tailwind source into the SchemaNode tree (parse, never execute) with whitelist sanitization, manifest validation, and `.d.ts` codegen for the JSX type surface. `PageRenderer` renders `kind:'jsx'` pages; `ComponentRegistry` gains `tier` + `getPublicConfigs()` (capability vs contract).
