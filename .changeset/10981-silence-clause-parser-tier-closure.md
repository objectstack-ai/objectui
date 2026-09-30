---
'@object-ui/types': patch
---

Correct the last four published "no error, no warning" clauses that the parser tier contradicts (objectui#10981, closing the family of objectui#10928 and objectui#10959).

- The `FormSchema.mode` refusal (objectui#10286) said every spelling "rendered the same form — no error, no warning". `validateTree` answers `mode` on a `form` node with an `unknown-prop` warning, so it now says "no render-time error or warning; only the parser tier's `unknown-prop` warning noticed it".
- The `TimelineSchema.events` docblock (objectui#6170), which ships in the emitted `.d.ts`, said a timeline authored with `events` "drew an EMPTY rail, with no error and no warning". It gets the same clause: the parser tier answers `events` with `unknown-prop`.
- The `BaseSchema.bind` docblock said a `bind` on `data-table` renders its header over an empty body "with no error and no warning". Neither half was true: `data-table` logs a console warning for an authored `bind` (objectui#6575), and the parser tier answers it with `unknown-prop`. It now says "with no render-time error; nothing on the page says why, but a render-time console warning (`[ObjectUI] DataTable bind:`, objectui#6575) and the parser tier's `unknown-prop` warning both name it".
- The note on the `object-grid` `exportOptions` refusal (objectui#7762) said a bare format array lost to the default with "no error, no warning, no console line". The registration declares `exportOptions` as an object, so the parser tier answers an array with `type-mismatch`, not `unknown-prop`, and the note now says "no render-time error, warning or console line (only the parser tier's `type-mismatch` warning noticed it)".

Message, `.describe()` and documentation text only: every document is accepted or refused exactly as before, with the same issue code at the same path. Every other word of each message and docblock is unchanged.
