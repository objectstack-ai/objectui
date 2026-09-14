---
'@object-ui/core': minor
---

The ingestion choke point says out loud when it CANNOT fold a retired spelling
(objectui#8938)

Maintainer ruling item 3 on objectui#7650 asked the retired-dialect fold for "a loud
diagnostic (not a silent drop) for a spelling the choke point cannot fold". What shipped
warned about the spelling it CAN fold and said nothing about the three it cannot, which is
the half that matters to a reader: a key that folds reaches every consumer, and a key that
does not reaches none of them — the retirement cards in this family (objectui#7155, #7166,
#7435) narrowed those consumers to the canonical spelling.

`normalizeSchemaReferenceKeys` now names all three refusals, in dev only and memoised per
(object, field, spelling, reason), the discipline the two existing warnings already use:

- **no declared twin** — `FieldSchema` declares neither the key nor anything sharing its
  alias spelling, so there is nothing to fold onto (`id_field`, `title_format`, and a typo
  such as `sortible`). The message ⛔ never offers a near match: the refused alternative
  was the spec's `lintAuthoredRecordKeys`, whose Levenshtein fall-through answers "did you
  mean `sortable`?" for that input, and a serve path that suggests a correction is one
  revision away from applying it.
- **ambiguous probe** — two or more declared keys share the alias spelling, so the fold
  refuses to choose. Unreachable against a spec with no collision; the pin that exercises
  it substitutes a colliding `FieldSchema`.
- **occupied canonical** — the declared twin is on the def carrying a **different** value.
  The producer's value stands (this choke point never overwrites one) and the retired value
  is inert. Same value under both spellings is deliberately silent: that is the state the
  pass leaves behind on its own second run, and the adapter re-serves a cached schema.

**Nothing about which keys fold changes.** The diagnostic fires only on the paths that
already left the key alone, the leave arm stays lossless, and it is a no-op under
`NODE_ENV=production`. Whether the fold's full width — lock and gate keys included — is
the intended accept set is an open decision on objectui#7650, untouched here.

Landed with the width pin objectui#8938 asked for, which drives every snake twin the
linked `@objectstack/spec` implies through the public choke point, and with the correction
to the objectui#7650 changeset that presented a handful of keys as the accepted set.
