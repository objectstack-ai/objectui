---
'@object-ui/types': minor
'@object-ui/plugin-detail': patch
---

`record:related_list` accepts `relationshipValueField`, and three record
renderers stop erasing their own props annotation (objectui#8649).

**`@object-ui/types` — `RecordRelatedListComponentProps` gains
`relationshipValueField?: string`.** Nothing that worked stops working; a
document that was already valid everywhere else stops being refused here.
`@objectstack/spec` declares the key (`RecordRelatedListProps.relationshipValueField`,
`z.string().default('id')`), `RecordRelatedListRenderer` has always read it, and
`@object-ui/plugin-detail`'s registry has published it as an input since
objectui#3808 — every layer declared it except this published TypeScript face:

```ts
// before — TS2353, while the platform accepted the same document
const props: RecordRelatedListComponentProps = {
  objectName: 'task', relationshipField: 'account', relationshipValueField: 'name',
};
// after — accepted, with the contract's own type
```

This is an **alignment, not a widening**: the accept set of this face moves to
the contract's and never past it. The pin that says so re-derives the contract
side on every run rather than restating it
(`packages/plugin-detail/src/renderers/__tests__/detailRendererUndeclaredKeys-8649.test.ts`).

**`@object-ui/plugin-detail` — the annotation-erasing destructure default is
gone from three renderers.** `record-details.tsx`, `record-highlights.tsx` and
`record-related-list.tsx` each annotated `schema` correctly and then wrote
`schema = {} as any`. A destructuring default's type joins the annotated
property type at the binding, so `any` erased the annotation for *every* read
site in the file — declared keys and undeclared ones alike read `any`. No
published surface moves: the exported annotations were always correct.

The repair made the compiler name a latent contract violation the `any` had
hidden, and it is fixed here: `RecordRelatedListBody` passed a possibly-unbound
`objectName` into `ResolveRelatedRecordActionsInput.objectName`, which is
`string`. The call is now gated on the key being bound. **Output-identical**,
both halves measured rather than assumed — `resolve` is pure and its only use of
the key (`objects.find((o) => o?.name === objectName)`) finds nothing for
`undefined` and returns `{}`, and the result is discarded on that path by the
`if (!objectName)` placeholder return.

**`record:reference_rail` declares the node-level `properties` envelope it
reads, and the read now uses the declaration.** The renderer accepts a node
either flattened (`schema.entries`) or enveloped (`schema.properties.entries`).
The enveloped read went through an explicit `(schema as any)` cast — **not**
through the schema type's `[k: string]: any`, which had nothing to do with it —
so `entries` arrived as `any` on that path. Both halves are fixed here: the
member is declared **and** the cast is removed, so the checker types the read
`ReferenceRailEntry[]` (the trailing `as ReferenceRailEntry[]` assertion went
with it — the declared type supplies it). `properties` is `@objectstack/spec`'s
own node-level key (`PageComponentSchema.properties`, "Component props passed to
the widget") with the standing `dataSource` and `className` have. Declaring it
**narrows** an accept this face already granted through its index signature — it
widens nothing, and `properties` itself stays open because the contract declares
it as a record.

⚠️ Declaring a member is not enough on its own when the read site casts: a cast
defeats the declaration while a membership instrument still reports the member
as present. The pin now fails if the cast returns.

⚠️ **Three keys are deliberately NOT declared, and no runtime behaviour
changes.** `enforceFieldSecurity`, `redactFields` and `requiredPermissions` are
read by all three renderers and are **routed to the producer**, not declared
here and not retired here. Measured on the installed contract over the block-tag
map `ComponentPropsMap` — the authoring surface an author writes into — plus the
node envelope every block shares, with controls in the same pass:

```
enforceFieldSecurity · redactFields   declared by no block, and not on the node
requiredPermissions                   declared by exactly one block,
                                      `record:quick_actions`, and by none of
                                      record:details / :highlights / :related_list
aria · fields                         declared by many blocks          <- CONTROL
zzqx_no_such_key                      declared by none                 <- CONTROL
```

Declaring them here would make this repo accept what the platform refuses;
retiring the reads would delete a redaction that works today on the raw-node
path. Both keys stay honoured exactly as before, and the census above is a test,
so it goes red the day the platform declares one of them.
