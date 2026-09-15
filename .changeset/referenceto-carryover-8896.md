---
"@object-ui/plugin-designer": patch
"@object-ui/app-shell": patch
"@object-ui/types": patch
---

Keep a relationship target stored only as the retired `referenceTo` spelling (objectui#8896)

Two field-IO sites deleted the retired `referenceTo` key without keeping its
value, so an object whose lookup or master-detail target survived only under the
pre-objectui#6041 spelling lost the target on the way through:

- The Field Designer's carried-through half (fields whose stored type the
  designer cannot author, objectui#8060) re-emits the stored document verbatim
  with no read door in front of it. The strip took the target and the relationship
  guard then refused the whole object's save — including a save the author
  triggered by editing an entirely different field, on a page that renders the
  offending field read-only, so its "Pick the target object" advice named a
  control that does not exist there.
- The object designer's single read door for `draft.fields` deleted the target on
  load, leaving the target editor empty and committing the loss on the next save.

Both sites now lift the value onto the spec spelling `reference` before dropping
the retired key. The retired key still never reaches the wire, a live `reference`
is never overwritten by a stale legacy value, and a field with no usable target
under either spelling is still refused.
