# objectui#12285 live readings

Backend: e2e/live/ci/start-backend.sh, published @objectstack/*@18.0.0-next.2 (showcase at e5136ff10f), npm 10.9.4, no metadata fix needed.
Console: objectui branch claude/issue-12285-probe-by-package-id-r2 at 6e4f144 source (no console change), vite dev proxied to that backend.

## API (curl)
- phone.demo@example.com /apps/com.objectstack.setup: screen ['app-access-denied']; meta ['200 /api/v1/meta/app', '200 /api/v1/meta/app', '200 /api/v1/meta/app', '403 /api/v1/meta/app/com.objectstack.setup']
- phone.demo@example.com /apps/com.example.no-such-pkg: screen ['app-not-found', 'app-not-found-retry']; meta ['200 /api/v1/meta/app', '200 /api/v1/meta/app', '200 /api/v1/meta/app', '404 /api/v1/meta/app/com.example.no-such-pkg']
- phone.demo@example.com /apps/setup: screen ['app-access-denied']; meta ['200 /api/v1/meta/app', '200 /api/v1/meta/app', '403 /api/v1/meta/app/setup', '403 /api/v1/meta/app/setup']
- phone.demo@example.com /apps/com.example.showcase: screen ['Capability Map']; meta ['200 /api/v1/meta/app', '200 /api/v1/meta/app']
- admin@objectos.ai /apps/com.objectstack.setup: screen ['System Overview']; meta ['200 /api/v1/meta/app', '200 /api/v1/meta/app']

- member GET /api/v1/meta/app/com.objectstack.setup: 403 PERMISSION_DENIED "You do not have permission to open the 'com.objectstack.setup' app."
- member GET /api/v1/meta/app/setup: 403 PERMISSION_DENIED "You do not have permission to open the 'setup' app."
- member GET /api/v1/meta/app/com.example.no-such-pkg: 404 RESOURCE_NOT_FOUND
- admin GET /api/v1/meta/app/com.objectstack.setup: 200, envelope name setup, item.name setup
