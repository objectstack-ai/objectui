---
'@object-ui/types': minor
---

**BREAKING** — `AIInsightsSchema` and the `ai-insights` node type are RETIRED from
the published type face (objectui#8800, ADR-0049 enforce-or-remove).

`Clause-②: yes (narrowing)` — a published `.d.ts` member retires, on the
objectui#8178 precedent. Marked `minor`, not `major`: this repository scores its
own breaking changes `minor` and spells the breaking semantics out in the body
(`check:changeset-no-major` is what enforces that, and the level here is its
verdict, not the ruling's prose).

**FROM** `import type { AIInsightsSchema } from '@object-ui/types'` and
`{ type: 'ai-insights', … }` **TO** *nothing* — there is no replacement type, no
replacement key and no alias. **The one-line fix: delete the node.** It has never
rendered anything, in any release.

```ts
// before — compiles, then renders an error panel at run time
import type { AIInsightsSchema } from '@object-ui/types';
const node: AIInsightsSchema = { type: 'ai-insights', objectName: 'account', insights: [] };

// after — the import is a compile error (TS2305/TS2724) naming the symbol.
// There is nothing to migrate TO: remove the node from the document.
```

The declaration carried `objectName`, `data`, `config`, `insights[]` (with
`title`, `description`, `type`, `severity`, `metric`), `loading`, `autoRefresh`
and `refreshInterval`. Every one of them goes with it.

**Nothing that worked stops working, because nothing ever worked.** No package in
this repository registered the `ai-insights` discriminant, so no node of that
spelling ever reached a renderer: `SchemaRenderer` resolved it to the OBJUI-001
"Unknown component type" panel and the CLI validator reported an unknown schema
type. Both refusals are LOUD — this was never a silent swallow, which is why the
card was graded p3. What made it a defect anyway is the gap: `tsc` said **yes**
because the declaration sat on the published `.d.ts`, and then the document was
refused at run time. A compile-time blessing in front of a guaranteed runtime
refusal is what misleads an author, and misleads an AI reading the `.d.ts` as its
authoring manual. This change moves the refusal to the moment the node is written.

The three AI schemas beside it landed in the same commit and were given renderers
and registrations twenty-two minutes later; this fourth one never was, in the
seven months since. `AIFormAssistSchema`, `AIRecommendationsSchema` and
`NLQuerySchema` are registered, rendered and **untouched** here, as are the
shared `AIConfig`, `AIFieldSuggestion`, `AIRecommendationItem` and `NLQueryResult`
support types — each has a reader among those three, so none is orphaned. The
seven `?: never` member tombstones on those three schemas are objectui#8178's
retirement and do not move with this one.

⚠️ **The zero this rests on is the IN-REPO HALF, and the ruling was taken with
that limit attached.** This repository's tracked files were enumerated and the
spelling occurred exactly once — inside the declaration itself — against lit
controls from the sibling AI types in the same pass. ⛔ That is not evidence that
nothing in the world authors `type: 'ai-insights'`: customer applications,
published documents and tenant metadata at rest were **not** enumerated, and a
published package cannot see its external consumers. Such a consumer gets the
compile error above, which is why the FROM/TO is spelled out — and its documents
were already being refused at run time.

The retirement's tombstones are the comment standing where the interface was in
`ai.ts` and the comment standing where the barrel re-export was in `index.ts`; the
executable half, including the tree-wide census with its controls, is
`packages/types/src/__tests__/ai-insights-retired-8800.test.ts`. The objectui#8178
exclusion pin that deliberately held `AIInsightsSchema.objectName` out of *that*
retirement was rewritten **by this ruling**, which is the only thing that was ever
allowed to rewrite it.
