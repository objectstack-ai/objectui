---
'@object-ui/app-shell': patch
---

fix(app-shell): create and edit no longer render a container's first named form when it declares no default form

`@objectstack/spec` `ViewSchema` calls a view container's `form` its "Default form view" and
`formViews` its "Additional named form views". The console's view merge (`applyViewItem` in
`MetadataProvider`) made the FIRST form item to arrive an object's create/edit `.form` whenever no
served form item carried `isDefault`. So a container with only named forms rendered its first named
form as the create and edit form. In `examples/app-showcase`, `showcase_inquiry`'s only form is the
public, anonymous contact-us form.

`.form` now comes only from a served form item that carries `isDefault`. Arrival order decides
nothing: a default form arriving after a named one still wins, and a named form arriving after the
default does not displace it. A container with no `form` leaves `.form` unset, and create and edit
take the path an object with no form view takes: no curated sections, and the dialog lays out the
object's own fields. A named form is reached only by its name, through `formViews`.

Servers that still stamp `isDefault` on a promoted named form see no change. The change takes effect
with servers that serve a named-only container without a default form item (objectstack#21500). A
stack-packaged container that reaches the console unexpanded is expanded by the bundled
`@objectstack/spec`, which still flags its first named form as the default until that dependency
carries the same fix.
