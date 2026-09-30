---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

The tool preview's "Open in API Console" link now opens the API console inside the current app, with the tool's execute request pre-filled (objectui#10591).

The link pointed at `/developer/api-console?path=…`, a URL with no app segment. The console declares no route for it, so its catch-all redirected the author to `/`, the post-login landing, instead of the API console. The API console also read no query string, so the `path` the link carried was dropped even at the right URL.

- `@object-ui/app-shell`: `ToolPreview` builds the link from the `developer:api-console` registry key inside the app in the URL, `/apps/APP/component/developer/api-console`. That is the path Studio's Developer navigation reaches the API console at. The query carries the tool's execute path (`/api/v1/ai/tools/NAME/execute`) and `method=POST`. The link is rendered through the router, so a console mounted under a base path (such as `/_console`) keeps it inside that mount, and it still opens in a new tab. When the preview is rendered with no router above it, or on a route that names no app, it draws no link.
- `@object-ui/console`: `ApiConsolePage` reads `path` and `method` from the query string once, when it mounts, and pre-fills the URL field and the method selector. It does not send the request. The preset works on both of the page's mounts: the `developer/api-console` route and the `developer:api-console` registry key. `path` is used only when it starts with `/api/`; an absolute URL such as `http://…`, a protocol-relative `//host` URL or any other value is ignored. `method` is read only together with an accepted `path`, in any letter case, and only when it is one of the verbs the method selector offers. Without an accepted `path` the page opens exactly as before.
