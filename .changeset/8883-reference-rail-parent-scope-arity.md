---
"@object-ui/plugin-detail": patch
---

fix(plugin-detail): `record:reference_rail` compiles its parent scope by relationship ARITY, and stops offering a link it cannot express

The rail took an author-supplied `relationshipField` per entry and compiled it
as bare equality TWICE, in two different grammars: the `$filter` it puts on the
wire and the `filter[<field>]=<value>` URL its "View All" link points at. When
the named field is `multiple: true` — `Field.user({ multiple: true })` is the
platform's own shape — the stored value is an array, `=` asks whether that
whole array IS one id, and the driver refuses with `400 INVALID_FILTER` while
prescribing `$contains`. The rail was empty for a perfectly legal authoring
choice, and for one the platform reaches with no authoring at all: a child
object's `lookup` field is derived into a rail entry whatever its arity.

The `$filter` half now goes through `composeParentScopeFilter` from
`@object-ui/core` — the one compiler the related list's rows and its tab badge
already share — so a multi-value relationship is queried by membership and
everything else keeps `=` byte for byte. No authoring key was added: the author
is naming a relationship, and its storage form is the renderer's business. The
child object's field defs are resolved BEFORE the reads rather than after a
refusal, because the rail dispatches its queries once per (record + entries)
and has no second attempt to correct itself with. Resolution is best-effort,
not a gate: an adapter that cannot serve metadata still reads rows, with the
equality wire it has always sent.

The link half is the COST. No URL spelling on this surface carries membership —
the data surface recognises `gte`/`lte`/`gt`/`lt` and drops any other suffix,
and the route the rail actually links to parses equality only — so a hopeful
`[contains]` suffix would not narrow the destination at all and "View All"
would open the entire child table dressed as this parent's related records.
Rather than ship a rail whose rows and link disagree, the link is suppressed on
a multi-value relationship and the reason is logged once. Single-value entries
keep their link with a byte-identical href.
