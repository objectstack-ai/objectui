# objectui#12718 live reading

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`, showcase at `e5136ff10f1a`), port 4718.
Package created with `POST /api/v1/packages` `{"manifest":{"id":"com.qa.recheck","name":"QA Recheck","version":"1.0.0","type":"app","namespace":"recheck"},"enableOnInstall":true}` -> 201, no app.

| shot | console | rail heading | pillar title |
| --- | --- | --- | --- |
| `before-published-console.png` | the backend's published `/_console` | `COM.QA.RECHECK · NAVIGATION` | `com.qa.recheck` |
| `before-main-5e15928.png` | worktree vite dev, `StudioDesignSurface.tsx` at main `5e15928` | `COM.QA.RECHECK · NAVIGATION` | `com.qa.recheck` |
| `after-worktree-console.png` | worktree vite dev, the fix (`4d148d3`) | `QA RECHECK · NAVIGATION` | `QA Recheck` |

The heading is upper-cased by CSS; the texts above are `document.body.innerText`.
