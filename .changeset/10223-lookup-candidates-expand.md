---
'@object-ui/fields': patch
---

fix(fields): a lookup's candidate queries expand the reference columns they display

Opening a lookup field's dropdown sent the candidate query without `$expand`.
Every reference column the dropdown previews under each candidate (by default
the referenced object's leading `highlightFields`) therefore arrived as a bare
foreign key, and the lookup cell renderer fetched each related record on its
own: one extra request per candidate per such column, on every open. The
browse-all picker (`RecordPickerDialog`) did the same once per table row.

Both queries now ask for `$expand` on the reference columns they display,
chosen by `buildExpandFields` from `@object-ui/core` (the rule the list views
apply to their visible columns): the dropdown's previewed columns, and the
picker's columns other than its id column. The dropdown's recently-used rail
asks for the same expansion. Related records now render from the expanded
values with no request per row. A backend that ignores `$expand` still returns
bare ids, and those are resolved one by one as before.

`buildExpandFields` covers `user` columns as well as `lookup`,
`master_detail` and `tree`. A previewed `user` column therefore now shows the
person, as the picker table and the list views do, where it used to show the
raw id marked as unresolved.

What the dropdown and the picker hand onward is built from each row with its
expanded relations collapsed back to ids, through `toPredicateRecord` from
`@object-ui/core`. That covers option labels, `titleFormat` titles, the
committed value, and the records passed to `onSelectRecord` and
`onSelectRecords`, so none of them carries an expanded object. One difference
remains: `toPredicateRecord` returns ids as strings, so a numeric foreign key
in an expanded column reaches those callbacks in its string form.
