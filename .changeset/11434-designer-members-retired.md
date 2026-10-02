---
'@object-ui/types': minor
---

**BREAKING (authoring)** — seven members of the `@object-ui/plugin-designer` node declarations and their record types are retired on both faces, and two element types leave the package (objectui#11434, ADR-0049).

**Clause-②: yes** — authorable members of published `@object-ui/types` declarations narrow to `never`. Scored `minor`, not `major`: this repository scores its own breaking changes `minor` and spells the breaking semantics out in the body (`check:changeset-no-major`).

**Why.** objectui#11434 settled every declared member of this family that no designer reads, by the maintainer's criterion: "does the mainstream have it? Yes ⇒ give it a reader. No ⇒ retire it on both faces." Each member below was measured unread — by source and by a runtime probe through the real `SchemaRenderer` and registry, which drew the same markup with the member set and unset — and nothing in this repository or in ObjectStack authored it outside test fixtures. The seat ruled each one RETIRE. The members ruled READ keep their declarations; their readers ship in later changes of the same card.

**What changes.** Each member is now a `?: never` tombstone on the TypeScript face, so `tsc` refuses it by name. On the zod face it is a retirement tombstone, so `safeValidateSchema`, the strict authoring face and `objectui validate` refuse it by name with the reason and what to write instead. Before this change the zod face refused `autoLayout` and `previewMode` only as unrecognized keys on the strict face, and accepted the other five. The renderers are untouched: every member was ignored at render before, and still is.

**Migration — one line per member.**

- `DataModelDesignerSchema.autoLayout`: delete it. Auto-layout is an action; use the data-model designer's toolbar Auto Layout button.
- `ReportDesignerSchema.previewMode`: delete it. Preview is a mode of the tool, not report state; for a chrome-free, non-editable layout author `readOnly: true`, `showToolbar: false` and `showPropertyPanel: false`.
- `DesignerComponent.parentId`: delete it, and nest the child in its parent's `children` array, the tree's one spelling.
- `DataModelRelationship.onUpdate`: delete it. The platform's relationship contract has no update behaviour, so there is nothing to configure in its place.
- `BPMNNode.serviceEndpoint`: delete it; there is nothing to configure in its place. A service task references an implementation, not a URL.
- `ObjectDefinition.relationships`: delete it, and declare each relationship on the referencing field instead — in the designer, a `lookup` field whose `referenceTo` names the related object (in `@objectstack/spec` metadata, a `lookup` / `master_detail` field whose `reference` names it). `@objectstack/spec`'s `ObjectSchema` already refused an object-level `relationships` array as an unrecognized key, and `MetadataService` never put it on the wire.
- `DesignerFieldDefinition.validationRules`: delete it. Put bounds on the field as `min` / `max` / `minLength` / `maxLength` in the field metadata, and any other rule in the object's `validations`. `@objectstack/spec`'s `FieldSchema` refuses `validationRules` as an unrecognized key, and no converter carried it.

**Removed exports.** `ObjectDefinitionRelationship` and `DesignerValidationRule` typed only the two retired arrays above, so they leave the root barrel, and their zod mirrors `ObjectDefinitionRelationshipSchema` and `DesignerValidationRuleSchema` leave `@object-ui/types/zod`. A consumer that imported one gets a compile error naming it; drop the import along with the retired key.

```ts
// before: compiled, and the relationship list reached nothing
const account: ObjectDefinition = {
  id: 'account',
  name: 'account',
  label: 'Account',
  relationships: [{ relatedObject: 'contact', type: 'one-to-many' }],
};

// after: the relationship is a field on the referencing object
const contactAccount: DesignerFieldDefinition = {
  id: 'account',
  name: 'account',
  label: 'Account',
  type: 'lookup',
  referenceTo: 'account',
};
```

⚠️ **The census behind "read by nothing" is the in-repo half.** Every package, app, example, doc and skill in this repository, and the ObjectStack framework, was searched: none reads these members, and only test fixtures authored them. Customer applications and documents outside both were not enumerated. A TypeScript consumer that authored one of these keys gets a compile error naming it.
