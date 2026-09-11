---
---

Test-only: `packages/types/src/__tests__/filter-builder-mirror-6939.test.ts`. It sits
under `src/`, so the presence gate counts it, but nothing published moves — the
package's build `tsconfig.json` excludes `**/__tests__/**` and its `files` list is
`["dist", "README.md", "CHANGELOG.md", "LICENSE"]`, so the file never reaches a
consumer. Declared as releasing nothing.

objectui#9073: the doc reader objectui#8774 introduced located the terminating `;` of a
union in the RAW interface block and stripped line comments only afterwards. A `;`
inside a comment on one of the union's own rows therefore ended the slice early — the
published doc's FOURTEEN-member `type?:` union read as EIGHT — and the mirror/doc pin
then rendered *this mirror accepts `type` members … never published — the mirror
widened past the authority.* for six members the doc does publish.

⭐ The defect is the FALSE POSITIVE, not the under-count: that verdict sends whoever
reads it to look for a widening nobody made, and a checker that lies confidently is
worse than one that stays quiet.

Comments now come off BEFORE the key is located, and `at` is computed on the stripped
block — stripping shortens it, so an index taken before the strip addresses a different
place after it, and carrying one across drops the union's LEADING members instead. Both
hazards are pinned, alongside a control that is green in both worlds.

⛔ No accept set moves and the published doc is untouched: the defect was in the reader,
never in the surface it reads. One existing throw branch changes outcome — a union whose
only `;` lives in a comment is now `is unterminated` (loud) rather than a silently
truncated set; the throw's wording is unchanged and the two throws the floor test pins
are unaffected.
