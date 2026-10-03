---
'@object-ui/core': minor
---

`ValueDataSource` executes the empty pair `is_empty` / `is_not_empty` and the `$empty` operator, and `convertFiltersToAST` lowers `$empty` (objectui#11094).

`@objectstack/spec` 17.6.0 admits `$empty` to `FILTER_OPERATORS` (objectstack#20446). It also stops folding `is_empty` / `isempty` onto `is_null`, and `is_not_empty` / `isnotempty` onto `is_not_null`, and lowers them to `$empty: true` / `$empty: false` instead (objectstack#20570). `ValueDataSource` canonicalises AST operators through the spec's `canonicalAstOperator` and had arms only for the null pair. So on 17.6.0 a stored `is_empty` or `is_not_empty` rule on a `provider: 'value'` source reached the refusal arm: it selected no row and logged one refusal per `find()`.

**After.** `is_empty` and `$empty: true` select a row whose value is null, absent, `''` or `[]`. `is_not_empty` and `$empty: false` select exactly the other rows. The answer is the spec's own `isEmptyFilterValue`, called without a field declaration, because this adapter holds none. That is the by-value reading the spec gives a face with no declarations, the same call `@objectstack/formula`'s matcher makes. A `$empty` flag that is not `true` or `false` is refused like every other refusal in this adapter: the row is excluded and the reason is logged once.

**What moves for a stored rule.** On 17.5.0 the empty pair was a null test here. A row whose value is `''` or `[]` is now selected by `is_empty` and no longer by `is_not_empty`. Rows holding a value, null or no key answer as before.

`convertFiltersToAST` lowers `{ f: { $empty: true } }` to `['f', 'is_empty', true]` and `$empty: false` to `['f', 'is_not_empty', true]`, the inverse of the spec's `parseFilterAST`. A flag that is not a boolean throws a `FilterOperatorError` (`code: 'INVALID_FILTER'`, `httpStatus: 400`). Before this, the operator reached the unknown-operator throw. The unknown-operator message now lists `$empty` among the supported operators. `@object-ui/data-objectstack`'s `find()` lowers an object `$filter` through this function, so an object filter carrying `$empty` reaches the wire there instead of throwing.
