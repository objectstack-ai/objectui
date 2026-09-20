---
'@object-ui/types': patch
'@object-ui/fields': patch
---

docs(types,fields): the `rows` / `options[].description` docblocks stop asserting a refusal the contract no longer performs

Five shipped doc comments told a reader that `@objectstack/spec` REFUSES two keys BY NAME. It declares both. The sentences were measured correctly against 17.2.0 and outlived the contract they described — `@objectstack/spec` 17.3.0 implemented the maintainer's 2026-08-25 Option-A ruling on objectui#6140 / objectui#6153 and declared them, and this repo's pin has since moved past it. Docblocks in `packages/types/src` ship in `dist/*.d.ts`, so the false prose was reaching consumers.

Corrected, each against the installed artifact rather than against the changelog:

- **`rows`** — `FieldSchema` accepts it on `textarea` / `markdown` / `html` / `richtext` as an integer of at least 1. It is TYPE-GATED: on a field type with no rows-sized editor surface the refusal arrives as a cross-field refinement naming the key, deliberately not `unrecognized_keys`, so "declared" must not be read as "declared everywhere". `MarkdownFieldMetadata.rows`, `HtmlFieldMetadata.rows` and the `RichtextFieldMetadata` cross-reference now say so.
- **`options[].description`** — `SelectOptionSchema` accepts it as a string, and a field whose `options` carry it parses whole, so it may now be authored. `SelectOptionMetadata` and its interface docblock now put the still-refused keys where the emphasis belongs: `icon` and `disabled`, which are what keeps "the schema still refuses something" a live fact.
- **`select-option.ts`** no longer enumerates the spec's option keys. The enumeration is what went stale — the keys arrive through the `Omit` by reference, so a list written above the derivation can only ever disagree with it — and it is deliberately not replaced with a longer list.

No runtime behaviour, type surface or export changes; every assertion in the repaired files passes unchanged before and after, which is the point — nothing mechanical was watching these sentences.

Two of the five sites are now watched. They are written as single-line claims about the installed pin, which moves them out of `scripts/check-installed-spec-pin-claims.mjs`'s ledger of known-stale debt and into the population that gate re-derives at every bump; their ledger entries are deleted in the same change, as that gate's both-direction ratchet requires. The remaining three sit on facts no instrument reads, and say so rather than reading as live.
