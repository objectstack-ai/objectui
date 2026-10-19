---
'@object-ui/app-shell': patch
---

Studio's RLS policy editor now asks `@objectstack/lint`'s RLS rule about every `USING` or `CHECK` clause that parses, not only about one the runtime cannot lower (objectui#13082). A predicate that lowers but reads something the rule refuses, such as `current_user.nope == owner_id`, was silent before: the draft autosaved, and publish then refused it as `rls-predicate-unknown-user-variable`. It is now the rule's error, in the rule's words, and it holds Save and autosave.

The same holds for the rule's other verdicts that read the clause alone: a `current_user` value of the wrong type for its position (`owner_id == current_user.org_user_ids`) and a refused `null` comparand (`status in ['a', null]`), both `rls-predicate-unenforceable`. A valid predicate such as `owner_id == current_user.id` stays clean.

The verdicts that read more than the clause stay at publish: an unknown field (the editor's field list is read from the published object and misses fields in a pending object draft, so a near miss stays a non-blocking "did you mean" warning), a comparison between fields of incompatible types (the editor holds no field types), and the server engine's own filter check.
