---
'@object-ui/types': minor
---

Converge the two named select-option types onto one spec-derived base.

`SelectOptionMetadata` (`field-types`, the object-metadata read model) and `SelectOption`
(`form`, the SDUI form vocabulary) each restated the select-option vocabulary by hand.
Both now extend the new `SelectOptionBase`, which derives the spec's keys from
`@objectstack/spec/data` **by reference** and writes out only the divergences. A key the
spec adds now reaches both faces with no edit here; a key it removes becomes a compile
error at the sites that read it, instead of a hand copy that goes on compiling while the
contract moves underneath it.

**What widened.** Exactly one key, on one face: `SelectOptionMetadata` gains
`default?: boolean`. It is a spec key that face could not describe before — ruled
`enforce` on the object-field face (objectstack#7246), where the engine seeds a new
record from the option marked `default: true` — and it arrives OPTIONAL, so every
document that face accepted before is still accepted.

**What narrowed.** Nothing. Both faces resolve to member-for-member what they resolved to
before (`SelectOption` identically; `SelectOptionMetadata` identically plus `default`),
pinned invariantly against the pre-convergence member lists in
`select-option-tier1-convergence-7014.test.ts` so a future "unification" cannot quietly
drop a key. `SelectOption.value` keeps its deliberate widening past the spec's machine
identifier (numeric/boolean values for standalone forms, objectui#3090), now named in an
`Omit` instead of restated.

**The convergence is an EXTENSION, not a replacement.** objectui legitimately carries
keys the spec does not: `description` (`LookupField` searches it, objectui#6153) on the
metadata face, and `disabled` / `icon` on both. The spec's `SelectOptionSchema` is strict
over exactly `{label, value, color, default, visibleWhen}` and refuses each of those
three **by name**, so they are declared as objectui dialect with that refusal written
into the published JSDoc rather than described as spec-aligned. These are read-model keys
and must never reach an authored object document — a field's `options` are routed through
the strict schema, so one of them fails the whole field.

`SelectOptionBase` is exported from `@object-ui/types` because it appears in the
`extends` clause of both published interfaces.

⚠️ **Dated note, 2026-09-27 — `description` has since moved inside the spec's option
vocabulary — objectui#10801.** `@objectstack/spec` 17.3.0 declared it (the
objectui#6140 / objectui#6153 ruling), and this repository resolves 17.4.0 on this date.
Measured on 17.2.0, 17.3.0 and 17.4.0, each probe beside a control that differs only by
the key: from 17.3.0 `SelectOptionSchema` is strict over six keys, `description` among
them, so an option carrying it is accepted and a field whose `options` carry it parses
whole, while `disabled` and `icon` are still refused by name (`unrecognized_keys`). So
the EXTENSION paragraph above no longer describes the contract for `description`: it may
reach an authored object document, and "must never reach" now holds for `disabled` and
`icon` only. The derivation this entry introduces did what it promises, and the spec's
new key reached both faces with no edit here; that also means "exactly one key, on one
face" and "`SelectOption` identically" undercount what ships, because the SDUI form face
`SelectOption` gains an optional `description` too (nothing narrowed). The text above is
kept as the reading of this change; `select-option-spec-extension-7014.test.ts` and
`select-option-tier1-convergence-7014.test.ts` in `@object-ui/types` re-derive the key
set, both refusals and the form face's gained key against the installed spec.
