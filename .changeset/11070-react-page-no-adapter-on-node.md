---
'@object-ui/components': patch
---

fix(components): a `kind:'react'` page no longer writes the host adapter under each block's `dataSource`

The react-page wrapper built every injected block's node (and every `<Block>`
node) as `{ dataSource, ...props, type }`, with the host's data-source ADAPTER,
or `null` before one connects, under `dataSource`. On a node that key is
`@objectstack/spec`'s per-element BINDING (`PageComponentSchema.dataSource`,
`{ object, view, filter, sort, limit }`), so the wrapper wrote an adapter into
an authored key. Such an in-memory node was refused by `safeValidateSchema` on
every block that declares the binding. That also kept `object-chart` from
declaring it.

The node now carries only what the author wrote. The adapter still reaches every
block through the `SchemaRendererProvider` the page is wrapped in, the channel
each registered block already resolves it from. `SchemaRenderer` never spread
the node's `dataSource` as a React prop, and the gate ignores a value that is not
a binding. The one widget family that looked for an adapter on its own node
(the `lookup` / `user` field widgets, reached through `<Block>`) falls through
to that same provider. An author's `dataSource={{ object: 'x' }}` arrives on the
node as written, as before.

Who notices: a host-registered component, rendered inside a react page, that
read the adapter off `schema.dataSource`. It gets the node's authored binding,
or nothing, and should read the adapter from the schema renderer context
(`SchemaRendererContext`), as it must everywhere outside react pages.
