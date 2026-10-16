---
'@object-ui/app-shell': patch
---

Studio's condition builder no longer writes `!field` or a bare `field` for a field that is not a boolean, when it knows the field's type (objectui#11894).

Its two operators that take no value compiled to a bare field and to `!` plus the field, whatever the field was. CEL's `!` and a bare `&&` operand take a boolean, so on a date, text or lookup field the condition could not be evaluated, and a server-evaluated condition refused the write it guarded. A validation rule built on the Studio Rules tab as *status equals done AND due date is empty / false* saved as `record.status == 'done' && !record.due_date`, and every write to a done record was then refused (`no such overload: !null`, or `!string` when a due date was set).

The two operators now follow the field's declared type. On a boolean field they read *is true* / *is false* and compile as before. On any other field they read *is not empty* / *is empty* and compile to a null-or-empty check, by the row of the platform's "is empty" table the field takes (`expandEmptyOperator` from `@objectstack/spec`): null only (`== null`) for a date, number or single-value lookup; null or `''` for a text field; null or an empty list (`size(...) == 0`) for a tags, multi-select or checkboxes field, and for a lookup, user, select or file field declared `multiple` where the editor's field list carries that flag. A subject the builder cannot type (a context value such as `user.isAdmin`, a flow variable, or a formula field, whose value takes its return type) keeps the words and the form it had. A new row starts on *equals* rather than on *is set / true*.

The Studio Rules tab now hands the builder each field's type and `multiple` flag, so the rule above is saved as `record.status == 'done' && record.due_date == null`. The other editors that mount the builder (hook conditions, action visibility, page-block visibility, flow conditions and schema-form condition fields) already passed the type, but not `multiple`, so there a lookup declared `multiple` is checked as a single value.

A condition stored by the old builder as `!field` on a typed non-boolean field is not rewritten: it opens in the expression editor as written.
