---
'@object-ui/app-shell': patch
---

fix(app-shell): the generic metadata editor renders a stored `view`, and a string-array repeater edits strings

Opening a view from Studio's Related tab (object → Related → Views → a row)
mounts the generic metadata editor over the server's `view` schema. That schema
is a union over the stored view shapes (ViewItem record, `defineView`
container, list overlay, form overlay) with no top-level `properties`, and the
form read only top-level `properties`: every stored view opened an editor with
zero controls (objectui#11251).

`SchemaForm` now resolves a top-level `anyOf` / `oneOf` against the value with
the union resolver it already uses for union-typed fields. Two refinements to
that resolver make it land each stored view on its own member: a member that is
itself a bare union is scored member by member, and among members that fit the
value's kind, the one the value contradicts least wins (a key a closed member
does not declare, a `const` / `enum` it pins elsewhere, a `required` key the
value lacks). Where the contradictions tie, the pick is the one it always
was.

That makes a string-array `view.columns` reachable, so the repeater now draws
scalar rows when its items resolve to a scalar arm (objectui#10239): each row is
one control over the row value, and Add appends a scalar. Editing a row used to
spread the string into an object (`{"0":"n","1":"a",…,"field":"title"}`) that no
arm accepts, and the row summary read `String.prototype.link`. Object rows keep
their declared sub-fields, and an empty value's first Add still gives an object
row.
