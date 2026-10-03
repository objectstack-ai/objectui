---
'@object-ui/plugin-form': minor
---

`record:line_items` now publishes every key of its `@objectstack/spec` 17.6.0
row (objectui#11536). Each key was decided by measuring it through
`SchemaRenderer` and the block's registration, per the objectui#11111 ruling:
declare what the panel honours, leave out what it does not. All ten keys the
row added over the registration move the panel, so all ten are declared.

Newly published, so the SDUI manifest, the JSX intrinsics and the page
validator accept them instead of reporting `unknown-prop`:

- `parentId` and `recordId`: the parent record whose lines are loaded and
  saved. `parentId` outranks `recordId`, and both outrank the record the page
  shows.
- `parentObject`: the parent object the line total is written to on Save,
  together with `totalField`. It outranks the object of the record the page
  shows.
- `title`: the panel heading, a plain string.
- `readonly`: lines are shown without editing (no Save, no row actions).
- `minRows` / `maxRows`: Remove row is disabled at the floor; Add line and
  Duplicate row are disabled at the cap.
- `filter`, `sort` and `limit`: the additional criteria (AND-combined behind
  the parent relationship, never replacing it), the load order and the row
  cap (default 500), each read as a top-level key as well as through a
  `dataSource` binding.

Nothing changes at runtime: the panel already read every one of these keys.
