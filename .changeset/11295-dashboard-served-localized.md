---
'@object-ui/plugin-dashboard': minor
---

fix(plugin-dashboard): a served dashboard draws its own title, description and sub-caption, not the packaged catalog's (objectui#11295)

A dashboard read from the server's `/meta` route is already translated for the
request's locale. Since objectstack#20680 the server also keeps a published edit
over the packaged catalog: an explicit override beats the packaged default.
`DashboardRenderer` still ran the client bundle over the served strings. It passed
each served widget title, description and sub-caption to the bundle as the
fallback, and a bundle entry beats its fallback. So the packaged catalog won again
on the client, and a published edit drew as the shipped string, in `en` as well as
`zh-CN`.

`DashboardRenderer` gains a `localized` prop. A host that read its document from
`/meta` sets it, and the console's dashboard page does. With it, these texts are
drawn as given: the widget `title`, `description` and sub-caption
(`options.description`), and the renderer's own header `label` and `description`.
An inline per-locale map is still collapsed to the active language.
`useWidgetSubCaption` takes the same flag as an optional second argument.

What does not change:

- Without the prop, the bundle composition is unchanged. That covers a page's
  inline `dashboard` block, a preview and a design surface, none of which the
  server translated.
- Header-action labels keep their bundle lookup either way, because the server
  does not translate them.
