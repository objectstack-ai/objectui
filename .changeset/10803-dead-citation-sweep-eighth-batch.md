---
---

Comment-only in `@object-ui/app-shell`, `@object-ui/components`, `@object-ui/plugin-detail`,
`@object-ui/plugin-form` and `@object-ui/plugin-grid`: docblocks and code comments that cited
an `objectstack` issue or pull request by a bare number, which answers 404 in objectstack and
resolves to an unrelated issue or pull request in this repository, now cite the commit in
that repository that landed the change, written as objectstack and a 9-character sha
(objectui#10803, the eighth batch). One of them sits inside a quotation of an objectstack
source comment; there the commit stands in square brackets in place of the quoted number.
Comments that named objectstack's card for the effective operation set on detail and form
surfaces by its bare number, or qualified with this repository's name, now read
`objectstack#3546`: in this repository that number is an unrelated card. None of these
comment edits moves a claim or changes a code or type token. No published behaviour changes
through them, so this declares no release.

The same repair in the one pending changeset that carried such a citation is prose-only, and
its frontmatter is byte-identical.
