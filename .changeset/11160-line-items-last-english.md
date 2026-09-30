---
'@object-ui/fields': patch
'@object-ui/i18n': patch
'@object-ui/plugin-form': patch
---

fix(fields,plugin-form,i18n): the line-items grid's required-cell text and the master-detail form's config hints read the locale packs

Under a Chinese session two parts of the line-items family still rendered in
English. The line-items grid (`GridField`) named a required, empty cell as the
column label followed by ` is required`. That text is the plain cell's tooltip
and the `error` the lookup and file cells take. A master-detail collection that
could not be resolved showed one of three English configuration hints: no
`childObject`, a child schema that failed to load, or no lookup or
master_detail field linking the child to the parent.

They now read the locale packs. The grid cells reuse `validation.required`
(`{{field}} is required`), with the column label in `{{field}}`: the sentence
the form renderer already shows for a required field. The three hints read
new keys in all ten packs: `form.masterDetail.noChildObject`,
`form.masterDetail.schemaUnavailable` and
`form.masterDetail.noRelationshipField`. Property names (`childObject`,
`relationshipField`) and object names stay code elements and are never
translated.

English output is byte-identical to the literals these replace, with or
without an i18n provider.
