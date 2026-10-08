---
'@object-ui/app-shell': patch
---

Studio's condition builder no longer writes `!field` or a bare `field` for a field that is not a boolean, when it knows the field's type (objectui#11894).

Its two operators that take no value compiled to a bare field and to `!` plus the field, whatever the field was. CEL's `!` and a bare `&&` operand take a boolean, so on a date, text or lookup field the condition could not be evaluated, and a server-evaluated condition refused the write it guarded (`no such overload: !null`, or `!string` when the field held a value).

The two operators now follow the field's declared type. On a boolean field they read *is true* / *is false* and compile as before. On any other field they read *is not empty* / *is empty* and compile to a null-or-empty check, by the row of the platform's "is empty" table the field takes (`expandEmptyOperator` from `@objectstack/spec`): null only (`== null`) for a date, number or single lookup; null or `''` for a text field; null or an empty list (`size(...) == 0`) for tags, a multi-select or a multi-value lookup. A subject whose type the builder is not given (a context value such as `user.isAdmin`, a flow variable, a formula field, or a field list that carries no types) keeps the words and the form it had. A new row starts on *equals* rather than on *is true / set*.

A condition stored by the old builder as `!field` on a typed non-boolean field is not rewritten: it opens in the expression editor as written.
