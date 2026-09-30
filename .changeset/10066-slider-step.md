---
'@object-ui/types': patch
'@object-ui/fields': patch
---

feat(types): `SliderFieldMetadata` declares `step`

`@objectstack/spec`'s `FieldSchema` declares `step` ("Step increment for slider
(default: 1)") and `SliderField` has always read it, defaulting to `1`, but the
published `SliderFieldMetadata` did not declare it, so an author annotating a
slider field with the type could not write the key the widget honours. The
member is now declared, matching the spec's prose.

`SliderField` now reads `min`, `max` and `step` through the keys
`SliderFieldMetadata` declares instead of an untyped `field as any` carrier. No
runtime behaviour changes.
