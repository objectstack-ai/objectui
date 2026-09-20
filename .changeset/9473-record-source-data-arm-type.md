---
'@object-ui/core': minor
'@object-ui/plugin-calendar': minor
---

**`resolveRecordSourceConfig`'s `data` parameter now follows the arm it is already told, instead of contradicting it.**

The shared record-source ladder in `@object-ui/core` takes a REQUIRED `dataArm` argument precisely because blocks declare `data` differently — its own docblock says there is no repo-wide default, "because the answer differs per block and a default is how the second de-facto contract got in" (ruling objectui#8348, decision batch #83, 「8348 以协议为准」). Its parameter nevertheless declared a flat `data?: ViewData` — a discriminated union over four strict OBJECT arms, with no array member — while its rung-1 predicate `authoredDataIsOnTheDeclaredArm` takes `unknown` and admits an ARRAY on the `'array'` arm. The declaration contradicted the contract the same function documents and implements.

The `data` member is now `AuthoredRecordSourceData<Arm>`, a new exported conditional type keyed on the arm:

- `'view-data'` → `ViewData`. **Unchanged** — this is what the flat declaration said, and it was right for the three blocks on this arm (`object-grid`, `object-map`, `object-gantt`).
- `'array'` → `unknown[]`, the shape `ComponentPropsMap['object-calendar'].data` declares (`z.array(z.unknown()).optional()`, "Pre-fetched records").
- `'undeclared'` → `unknown`, since no published face declares a `data` row for such a block and rung 1 keeps its pre-8348 verbatim behaviour there.

⚠️ **Type-level only — no runtime accept set moves.** Nothing in the ladder's body changed: `authoredDataIsOnTheDeclaredArm` still takes `unknown` and still decides rung 1 on the value's KIND, so every resolved config — including the off-arm ones that fall through to `staticData` and then `objectName` — is what it was. The emitted JavaScript of both packages is unchanged by this card.

⚠️ **One compile-time refusal is new**, and it is the half that keeps this from being a mere widening: a caller that declares a `ViewData` provider block under `data` while passing `'array'` no longer type-checks. That document was already refused at runtime by objectui#8348, and by `os validate` and the save gate before that; only the signature still accepted it. A caller that holds the arm as a `RecordSourceDataArm` variable rather than a literal is unaffected — the conditional type distributes to `unknown` there, which a set of literal-armed overloads would not have done.

`@object-ui/plugin-calendar` loses the cast that stood in for the missing declaration: `ObjectCalendar`'s ladder call passed `data: schema.data as ViewData | undefined`, in a comment reporting an upstream defect in `@object-ui/core`. The three members are still passed one by one — they are what the ladder documents itself as reading — but the member is now `data: schema.data`, and `packages/plugin-calendar` type-checks green without the assertion.

Two stale docblock passages in `record-source.ts` and `record-source-config.behaviourNeutrality-7632.test.ts` explained `ObjectCalendar`'s retired `'data' in schema` guard by the props union `ObjectGridSchema | CalendarSchema`, which objectui#8651 retired — `ObjectCalendarComponentProps.schema` is the published `ObjectCalendarSchema` today. Both now say that the clause is history rather than a reading anyone can re-derive from `main`.
