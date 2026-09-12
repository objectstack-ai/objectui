---
'@object-ui/i18n': minor
'@object-ui/plugin-kanban': minor
---

**BREAKING** — `kanban.columns` is now an i18next plural family, not a bare unit
word (objectui#9170).

The kanban board's empty state composed its description by **concatenation**:
the lane count, a space, then `t('kanban.columns')`, which every pack declared as
a bare plural with no singular form. Read from the live region's own
`textContent`, a one-lane board announced `"No cards1 columns"` — and
`DataEmptyState` there is `role="status" aria-live="polite"`, so this is read
aloud.

## Why the old string was correct until it wasn't

The bare plural was not a latent bug. The empty state used to require
`boardColumns.length > 1`, so the count in front of `columns` could never be 1
and the plural always agreed with it. objectui#9045 made the region paint at zero
and one lane — that widening **is** the accessibility fix, and a wrong plural is
strictly better than the silence it replaced — and the one-lane form became
reachable with it.

## What changed on the published payload

Per pack, in all ten locales:

- `kanban.columns` now carries the count itself, e.g. `en` `'{{count}} columns'`;
- `kanban.columns_one` and `kanban.columns_other` are new.

The call site resolves the family (`t('kanban.columns', { count })`) instead of
putting a number in front of a unit word.

## Why this is **BREAKING** and why it is declared `minor`

The value of an **existing published key** changed. A consumer outside this
repository that read `kanban.columns` as a bare unit word and concatenated a
count in front of it now renders a literal `{{count}}`, because i18next leaves an
unfilled placeholder verbatim when no `count` is passed. Pass `{ count }` and the
key answers correctly, including the singular.

`minor`, not `major`: every package in this repository sits in one `fixed` group,
so a level is a property of the whole release rather than of one package, and
this repository aligns its major with `@objectstack`'s — `major` is refused
mechanically by `check-changeset-no-major.mjs`. Breaking changes ship as `minor`
with this carrier, which is the convention `AGENTS.md` states.

## The shape, and why not the other one

Both plural shapes have precedent here. This key takes **base + `_one` +
`_other`** (the `detail.repeaterItemCount` shape) rather than **base + `_one`**
(the `chatbot.plan.*` shape), because the base key is the slot every CLDR
category a pack does not enumerate falls to — and a kanban board's everyday two
to four lanes are exactly Russian's `few`. Spelling `ru`'s base as its numeral
plural would render `"3 колонок"` there, a genitive plural after a numeral that
governs the genitive singular; a `_few` key is not available, because `en` lacks
it and `all-locales-key-parity` fails a key `en` lacks by design. So `ru`'s base
is the category-neutral `"Колонок: {{count}}"` and its `_other` carries the
numeral form.

`zh` / `ja` / `ko` define all three slots with the **same** value. No singular is
invented for languages that have none: the `_one` key exists only because key
parity requires every `en` key in every pack.

## What did not change

The predicate stays lane-count-blind — a zero-lane and a one-lane board still
announce, which is the whole point of objectui#9045. The provider-less path is
unchanged: `createSafeTranslation`'s fallback resolves its defaults table
literally and never appends a plural suffix, so an embedder with no
`I18nProvider` mounted reads the same English it read before.
