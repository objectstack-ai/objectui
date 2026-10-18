---
'@object-ui/app-shell': patch
---

Both *Duplicate* forms judge a new package id by the spec's id rule, the one the server refuses by (objectui#11855).

The Studio landing's *Duplicate* form, and the package sheet's form that reuses it, armed their button with a regex of their own. It disagreed with the server in both directions: it refused `163.com.crm`, a digit-led segment the spec accepts, and it let `com.acme.my_app`, `com.-x` and `a..b` through to a 400 from the duplicate route. Its notice also told the author that underscores are allowed. Both forms now judge by `ManifestSchema.shape.id` from the installed `@objectstack/spec`, with the hint and notice the *New package* dialog already shows, so the three package-id forms share one rule and one wording. A plain id such as `com.example.myapp`, and the prefilled id (the source id with `-copy` appended), are armed as before.

An underscore stays in the field when typed, and the hint says underscores are not allowed, as in the *New package* dialog.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The two strings that described the old rule are removed from the console's own string table.
