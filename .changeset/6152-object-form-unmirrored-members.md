---
'@object-ui/types': minor
---

feat(types): the `object-form` zod mirror declares the members its TypeScript twin already declared (objectui#6152, round 1)

`ObjectFormSchema` in `@object-ui/types` (`objectql.ts`) declared a set of members that its zod
mirror in `@object-ui/types/zod` had never heard of. Every one of them is read by the `object-form`
renderer (`ObjectForm` in `@object-ui/plugin-form`). The two published faces answered differently:

- the tolerant validator (`AnyComponentSchema`, `safeValidateSchema`) kept any value at those keys
  without examining it, so `{ "formType": "carousel" }` parsed green and the form fell back to its
  simple layout;
- the strict authoring face (`StrictAnyComponentSchema`) refused the keys outright, although the
  published TypeScript type invites them.

The mirror now declares each member, shaped as the TypeScript type declares it:

- `formType`, `sections`, `defaultTab`, `tabPosition`;
- `allowSkip`, `showStepIndicator`, `nextText`, `prevText` (the last two are `@objectstack/spec`'s
  `I18nLabel`, by reference, like the form's other five label members);
- `splitDirection`, `splitSize`, `splitResizable`;
- `drawerSide`, `drawerWidth`, `modalSize`, `modalCloseButton`;
- `mobile`, `buttons`, `defaults`, `subforms`.

The `object-view` node's `form` slot is this mirror minus `type`, `objectName` and `mode`, so it
gains the same members.

What an author sees change:

- **Strict authoring face.** A document using any of these keys is no longer refused for them. The
  catalog's tabbed-sections form, for example, now parses strict.
- **Tolerant face (breaking for invalid documents).** A value of the wrong type at one of these keys
  is now refused at the key, where it used to be kept unexamined. Examples are an unknown `formType`,
  a string `splitSize`, or a `subforms` entry without `childObject`. A section entry is judged
  member by member. Its `fields` entries are not judged here, which is the same policy as the
  mirror's existing `customFields`. On the strict face a section is also closed, so an undeclared
  section key is named there. `@object-ui/types` is in the fixed release group, so this ships as a
  minor bump, per the repository's version policy.

Two members of the same TypeScript type are deliberately not mirrored:

- `submitHandler` is a function slot, and a string handler dialect is ruled out (objectui#6182);
- `open` is a boolean that only in-code hosts set.

Their routes are open on objectui#6152. No TypeScript declaration changed.

**Correction, 2026-09-30 (objectui#6152, round 3).** The paragraph above says the routes of `open` and `submitHandler` are open on objectui#6152. That was true when this change was written, and it no longer is: round 3 settled both. Each stays declared on the TypeScript type and unmirrored, as a runtime slot a host fills in code, so the published faces do not change for either key: `safeValidateSchema` still keeps an authored value at either key unexamined, and the strict authoring face still refuses both.
