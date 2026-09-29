---
'@object-ui/sdui-parser': minor
---

The generated JSX types let a declared input win with its type for every base prop, so `sdui-intrinsics.d.ts` compiles as generated (objectui#11075).

`generateDts` over the real public manifest produced a `.d.ts` that did not compile under `tsc --strict` without `skipLibCheck`: `TS2430 Interface 'RecordAlertProps' incorrectly extends interface 'SduiBaseProps'`. `record:alert` declares `visible` as a boolean, a bare CEL string or a `{ dialect: 'cel', source }` envelope, and its renderer honours all three. `visible` is an `'every-node'` base prop typed `boolean` in `SduiBaseProps`, and objectui#11044's `Omit` covered only the `'where-undeclared'` members. An author compiling against the file got an error inside the generated file instead of a check on their own JSX. With `skipLibCheck` on, the base `boolean` hid the string and envelope arms.

Now an interface `Omit`s every base attribute its registration declares, whatever the member's scope, and types it with the declared type:

- **`<record:alert>` accepts `visible` as a string and as the `cel` envelope** in the generated types, as the manifest declares and the renderer reads. A number is still refused.
- **Where a registration declares a base attribute with the base type** (`className?: string` on most html-tier tags and many blocks, `disabled?: boolean` on `element:button`), the interface extends `Omit<SduiBaseProps, …>` for it too. What those interfaces accept does not change.
- **`SduiBaseProps` itself is unchanged**: `visible`, `disabled` and `hidden` stay `boolean` on every type that does not declare them.

`validateTree` is unchanged: it still skips an `'every-node'` key before the declared-input lookup.
