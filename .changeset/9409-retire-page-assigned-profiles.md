---
'@object-ui/types': minor
---

**BREAKING (authoring):** `assignedProfiles` on a `page` node is now refused on both published faces (objectui#9409).

`@objectstack/spec` 17.5.0 retired `page.assignedProfiles`. ADR-0090 D2 deleted the Profile
concept the key was named after, and under ADR-0049 enforce-or-remove the spec's `PageSchema`
now declares the key as a `retiredKey()` tombstone that refuses any value. `@object-ui/types`
still declared it as an authorable `string[]`, described as "Profiles that can access this
page". Nothing in this repository ever read the key, so a page that listed profiles stayed
open to everyone who could reach it: the key read as access control and enforced nothing.

Both faces now take the spec's tombstone by reference, the way App `version` and Dashboard
`refreshInterval` already do:

- **Zod mirror.** `PageNodeSchema` no longer overrides the key. An authored value, an empty
  list included, fails to parse at `assignedProfiles` with the spec's own message, which
  names the remedy.
- **TypeScript.** `PageNodeSchema.assignedProfiles` is now the spec's member, which admits no
  value, so authoring one is a compile error. The hand-written `string[]` member is gone.
- **Docs.** The `PageNodeSchema` table in the schema reference marks the key as retired.

What to do: delete the key. Page audience comes from permission sets. Gate the data the page
shows with the object's permission sets, and grant those sets to people through positions.

```ts
// before: compiled and parsed, and gated nothing
const page: PageNodeSchema = { type: 'page', assignedProfiles: ['sales'] };
// after: refused by tsc and by the validator. Delete the key.
const page: PageNodeSchema = { type: 'page' };
```

This is released as `minor`, following this repository's version policy: breaking semantics
are marked `minor` and described here.
