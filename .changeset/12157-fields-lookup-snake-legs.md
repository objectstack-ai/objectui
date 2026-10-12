---
'@object-ui/fields': minor
---

The `lookup` widget reads `@objectstack/spec`'s `allowCreate`, `lookupColumns` and `lookupPageSize` alone. Their snake_case twins are retired, with no alias (objectui#12157).

- FROM `allow_create` → TO `allowCreate`
- FROM `lookup_columns` → TO `lookupColumns`
- FROM `lookup_page_size` → TO `lookupPageSize`

`LookupField` used to read each snake spelling FIRST, ahead of the key `FieldSchema` declares. That made a second spelling of three keys the spec refuses in snake_case. `resolveActionParams` retires its `lookup_columns` / `lookup_page_size` legs in the same change, so a field-backed lookup action param reads `lookupColumns` / `lookupPageSize` off the resolved field and nothing else.

A definition served through `ObjectStackAdapter.getObjectSchema`, or stored by the console's `MetadataProvider`, loses nothing. The ingestion fold (`normalizeSchemaReferenceKeys`, objectui#7650) stamps a stored snake spelling onto its declared key before the widget or the resolver reads it. Measured in `LookupField.snakeLegsRetired-12157.test.tsx` and `resolveActionParams.remainingLookupLegs-7435.test.ts`: a def that spells only the snake keys, run through that fold, draws the declared picker columns and page size and opts out of quick-create, exactly as the camelCase def does.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

A def that reaches the widget or the resolver WITHOUT the fold, and spells only a snake key, loses that setting. That covers a field def handed to `LookupField` directly (a hand-authored `form` field entry is one), a `DataSource` other than `ObjectStackAdapter`, and `resolveActionParams` given a host's own, unfolded `objects`. Measured on such a def, in the same two pins:

- **`lookup_columns` / `lookup_page_size`.** The browse-all picker draws the columns derived from the referenced object, on the default page of 10, exactly as for a def that sets neither key.
- **`allow_create: false` on a user-facing reference.** The quick-select offers "Create new" again, which is the widget's default for such a reference. It used to be suppressed.
- **The action-param resolver.** The resolved param carries no `lookupColumns` / `lookupPageSize`.

**Fix:** spell the key in camelCase (the value stays the same), or serve the definition through `ObjectStackAdapter` / `MetadataProvider`. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes (narrowing)**: three accepted spellings are retired from the widget and the resolver.
