---
'@object-ui/components': patch
'@object-ui/i18n': patch
---

fix(components): an `element:number` that asks for an aggregate and names no object says so instead of painting a silent dash

Since `element:number` accepts its object from the node-level `dataSource`
binding (objectui#10909), `object` is no longer a required input, and the
manifest has no way to say "one of `object` and `dataSource.object`". A node
that authors an `aggregate` with neither therefore passes the html tier with no
diagnostic, and the renderer used to paint "—", which reads like a real empty
value.

The renderer now draws a short muted notice in that case: "No object named: set
object or dataSource.object." It is renderer chrome, so it reads the locale
packs (`element.number.noObject`, added to all ten packs) and speaks the session
language. It does not throw and it queries nothing.

Only authored absence draws it. A binding that names an object keeps its own
panels while its `view` is resolving or after it failed to resolve, and a node
with no `aggregate` still paints the dash exactly as before.
