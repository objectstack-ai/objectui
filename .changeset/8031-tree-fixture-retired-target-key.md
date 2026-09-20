---
---

Test-only. Drops the retired snake_case target key from the three `type: 'tree'`
fixture fields that objectui#7839's `reference:`-keyed sweep could not see — in
`plugin-view`'s expand-gate suite, `plugin-list`'s relational-sort suite and
`plugin-calendar`'s expand-gate suite. Nothing published moves, so this declares
no release: the three files sit under `src/__tests__/`, which every published
tsconfig excludes from the emitting program (`pnpm check:published-tsconfig-exclude`),
each container is a module-local `const`, and all three packages ship `dist` only.

`FieldSchema` refuses that spelling BY NAME. Re-measured on the installed
`@objectstack/spec@17.4.0` with a nonsense key as the negative control: the
retired spelling draws `unrecognized_keys` **plus** a rename hint, the nonsense
key draws the same refusal with **no** hint — so the hint is attached to a
refusal, not to an acceptance. On a `tree` field the renderer side has read only
the declared `reference` since objectui#6837 half 2, and the list sort picker's
object-def branch reads only that spelling too. So the key was refused by the
schema and read by nobody; every rule under test reads the declared TYPE. All
three suites' verdicts are unchanged — 3 files, 23 tests, identical test-name
sets before and after.

⚠️ One correction to the framing these three were filed under, measured on the
fixtures themselves rather than inherited: they are NOT foreign-target. Each
container declares an object identity and the retired key already named exactly
it — `TASK_SCHEMA` is `task` and the field named `task`, the `objectDef` under
test in the relational-sort suite is `contacts` and the field named `contacts`,
`VISIT_SCHEMA` is `visit` and the field named `visit`. What made these three
refused is the SPELLING, not the target; the foreign-target reading belongs to
objectui#7839's four, whose containers either declare no identity at all or
named a different one.

The key is still DROPPED rather than renamed, and the correction is why that
matters: a refused key annotates nothing, so renaming it would turn a refusal
into an ACCEPTED self-annotation these fixtures never made. Measured on the same
installed copy, a `tree` field with no target and one that self-annotates are
both accepted, and a FOREIGN target is accepted too — `refuseForeignTreeReference`
landed upstream after this pin, so the canonical spelling would be a live claim
none of these suites needs.

`Clause-②: no` — three hand-built test fixtures. No symbol exported, removed,
renamed or retyped; no published `.d.ts` member and no accept set moves. The
diff deletes one property from a module-local object literal and adds comments;
the containers' own type annotation already declares that key optional and is
untouched, as is every sibling field that legitimately carries it.
