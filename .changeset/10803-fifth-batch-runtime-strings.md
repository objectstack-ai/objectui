---
'@object-ui/types': patch
---

fix(types): eight more runtime strings no longer point at objectui issues that answer 404

Six ADR-0049 retirement tombstones in the published zod mirrors, one refusal message and
one runtime description carried a pointer to an objectui issue that answers 404. A reader
of a parse error or a zod `description` has no repository to resolve a commit against, so
no dead pointer becomes a commit: the tombstones keep `ADR-0049` and lose the dead card
beside it, and every other pointer is simply dropped (objectui#10803).

- **The tombstone guidance.** `ChatbotSchema`'s `loading`, `showAvatars`, `userAvatar`,
  `assistantAvatar`, `markdown` and `height` tombstones feed both the parse error an
  author reads and the `.describe()` text, and each now opens `RETIRED (ADR-0049) —` where
  it opened with the dead card and `ADR-0049` together. The `showAvatars` message also
  ends its sentence about the fenced props spread at "was fenced." Everything else after
  the dash is unchanged, so the remedy each message gives is word for word what it was.
- **The `page` node's `actions` refusal** now reads "`actions` is not a key of the `page`
  node and never was: no renderer reads it", and the remedy after it is unchanged.
- **One description.** `ChartDataSeriesSchema.variant` now ends "the renderer-internal
  `current` spelling is not a member".

Nothing else in any string moves, and no key, path, issue code, accept set, refusal or
severity changes: every document that parsed before parses the same way and is refused at
the same path with the same code.
