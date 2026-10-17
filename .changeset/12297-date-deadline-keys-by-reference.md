---
'@object-ui/types': minor
---

`DateFieldMetadata` and `DateTimeFieldMetadata` take the deadline keys from `@objectstack/spec`'s `FieldSchema` (objectui#12297).

- **`dueLike`** is typed by reference to `FieldSchema.dueLike` instead of a local `boolean`, so it follows the spec when the spec moves. Its value type is unchanged.
- **`settledWhen`** is new on both interfaces, typed by reference to `FieldSchema.settledWhen`: a CEL predicate over the record (`record.status == 'done'`), as a bare string or as the spec's expression envelope, that settles the deadline for that record. The spec accepts it only beside `dueLike: true`. It is declared, not yet rendered: no date or datetime cell evaluates it yet, so a past deadline on a settled record still renders overdue.
