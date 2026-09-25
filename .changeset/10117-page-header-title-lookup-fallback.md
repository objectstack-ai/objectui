---
'@object-ui/components': patch
---

fix(components): `page:header` resolves a lookup title candidate instead of handing its expanded object to JSX (objectui#10117)

A record whose declared name field was empty took the whole `page:header` block
down with "Objects are not valid as a React child" (React #31), leaving the red
"failed to render … Retry" panel where the H1 belongs while the rest of the page
rendered. The reported object declares `nameField: 'name'` over a
hook-computed readonly text field and a required `subject` lookup; a record
created by an admin never gets its `name`, so the header walked past it to
`subject` and put that field's **expanded reference object** into the heading.

The header's record-chrome branch asked the unified ADR-0079 resolver with
`deriveFromRecordKeys: false` and then re-spelled the rung it had just switched
off as a raw `data?.name || data?.full_name || data?.title || data?.subject || …`
chain. That is a second implementation of the question `recordDisplayValueAt`
exists to answer, and it diverged from it on both of that function's own
clauses: raw `||` reads the **stored** value, so an expanded reference reached
JSX unchanged, and it counts a whitespace-only string as a value, so a name
field holding only spaces rendered a blank H1.

⭐ The resolution was never missing from this tree. The breadcrumb resolves the
same record through the same resolver **without** `deriveFromRecordKeys: false`,
so each of its rungs runs through `recordDisplayValueAt` and on to the embedded
object's display chain — which is why it showed the business unit's name
correctly while the header beside it crashed. The copy is deleted and that rung
is now asked for instead of imitated.

Three things change for an author:

- a lookup or reference used as a title now shows the referenced record's
  display name, resolved exactly as the breadcrumb and the detail grid resolve
  it, and never as a raw object;
- an object that **names** its title field — a declared `nameField` /
  `displayNameField`, or a type-aware derivation over its `fields` — no longer
  borrows a different field's value when that field is empty. It degrades to
  the header's existing `${objectLabel} ${id}` placeholder. The silent hop to
  the next candidate was part of the defect, not merely how it was rendered, so
  the fallback chain's behaviour is what changed. The record-key safety net
  still runs in full for an object that names no title field at all, which is
  the case it was added for;
- a non-string title candidate is reduced through that same display-value
  authority before rendering. This is a backstop and deliberately last: on its
  own it would have replaced the crash with a header quietly showing the wrong
  field's contents. The remaining way one arrives is an author-supplied `title`
  that is not a string, which the header's `interpolate` returns untouched.

A whitespace-only value is now empty here for the same reason it is empty to
`recordDisplayValueAt`, so such a record shows the placeholder rather than a
blank heading. A record with a non-empty name renders exactly what it rendered
before.
