---
'@object-ui/plugin-form': minor
---

The `object-form`, `view:form`, `embeddable-form` and
`object-master-detail-form` registrations no longer declare `objectName`
required, so the page compile accepts a node whose `dataSource` binding names the
object, and a form that names its object in neither place shows a hint instead of
a form with no fields (objectui#11605).

`@objectstack/spec`'s `object-form` and `object-master-detail-form` rows leave
`objectName` optional, because the node's `dataSource` binding can supply it;
`embeddable-form` has no spec row, and the binding doc says a bound node needs no
`objectName` of its own. Each renderer agrees: `dataSource.object` lands on
`objectName` before the form reads the node. The registrations still declared
`required: true`, and the page compile reads them, so a bound form with no
`objectName` of its own was refused with `missing-required-prop` and the save
failed.

**Clause-②: yes (widening)** — an `object-form`, `view:form`, `embeddable-form`
or `object-master-detail-form` node that names its object through
`dataSource.object` and sets no `objectName` now compiles and saves. A node that
names its object in neither place also compiles now, and shows "No object named:
set objectName or dataSource.object." where it used to draw a field-less card, a
public form that could not submit, or an empty parent form. An `object-form`
or `view:form` whose fields are declared inline shows no hint and renders as
before: non-empty `customFields`, or `sections` whose every field is an inline
field, the target-less collector the `tabbed`, `wizard`, `split`, `drawer` and
`modal` variants render. `formId` on `embeddable-form` and `details` on
`object-master-detail-form` are still required. The published `objectName`
inputs now carry a description that says the binding can supply them.
