---
'@object-ui/types': minor
---

**BREAKING (authoring)** — a report element's `properties.field` is refused by name on the zod face; the element's binding is its declared `dataBinding` (objectui#11434, ADR-0049).

**Clause-②: yes** — the zod face of `@object-ui/types` narrows: `safeValidateSchema`, the strict authoring face and `objectui validate` refuse one key they accepted before. Scored `minor`, not `major`: this repository scores its own breaking changes `minor` and spells the breaking semantics out in the body (`check:changeset-no-major`).

**Why.** objectui#11434 ruled every declared-and-unread member of the `@object-ui/plugin-designer` family READ or RETIRE, and this release ships the last readers: the page designer's, the shared canvas's `backgroundColor` and the report designer's. One of them had a rival. `ReportDesigner` drew a field element from `properties.field`, a key `ReportDesignerElement` never declared, and wrote that key itself when a field element was added, while the declared `dataBinding` was drawn by nothing. The seat ruled that a declared member beats an undeclared bag key: the designer now draws and writes `dataBinding` alone. The designer itself produced `properties.field`, so saved documents can carry it. It is refused by name rather than left to be dropped in silence.

**What changes.**

- `ReportDesignerElementSchema.properties` stays an open record, so a text element's `text` and every other type's own settings stay authorable on both validator faces. A check on it reports `field`, at its own path (`sections.N.elements.M.properties.field`), with the migration below.
- The TypeScript face is unchanged: `properties` is `Record<string, unknown>`, and its docblock carries the same migration. One key of an open bag cannot be refused in the type without parting from the zod record that keeps every other key open on the strict face.
- The members this release gives readers are documented on the TypeScript face with what draws them. `DesignerCanvasConfig.backgroundColor`, `DesignerComponent.children` / `.locked` / `.visible` / `.zIndex`, `DesignerPaletteCategory.icon`, `DesignerPaletteItem.icon` / `.preview`, `ReportDesignerElement.dataBinding` / `.format`, `ReportDesignerSection.groupField` / `.pageBreakBefore` and `ReportDesignerSchema.margins` keep their types.

**Migration.**

- `ReportDesignerElement.properties.field`: move the value to the element's `dataBinding`, and delete `properties.field`.

```ts
// before: the designer drew the bag key
const before = { id: 'amount', type: 'field', position, properties: { field: 'amount' } };

// after: the declared member, which the designer draws
const after: ReportDesignerElement = { id: 'amount', type: 'field', position, properties: {}, dataBinding: 'amount' };
```

⚠️ **The census behind "the designer produced it" is the in-repo half.** Every package, app, example, doc and skill in this repository, and the ObjectStack framework, was searched. The only producers were `ReportDesigner` itself (a new field element, and its property panel's Field entry) and one test fixture. Documents a host saved from the designer before this release were not enumerated.
