# objectui#12524 — evidence

Screenshots for the draft status chip's one place in every pillar's item header. Taken from the local console (vite, at feature commit `d9376cc`) against HotCRM `63db83e` under `objectstack dev --fresh`, at a 1280 × 820 viewport, in a writable package (`com.acme.evidence`, created with `POST /api/v1/packages`) holding a draft object, flow, page and app.

| File | Shows |
| --- | --- |
| `12524-data-header-{light,dark}.png` | Data: title, api-name chip, "Unpublished draft", field count |
| `12524-automations-header-{light,dark}.png` | Automations: title, "Unpublished draft", trigger meta, Enabled switch at the right |
| `12524-interfaces-header-{light,dark}.png` | Interfaces: title, kind chip, "Unpublished draft"; Design / Run and the properties toggle alone at the right |
| `12524-interfaces-full-{light,dark}.png` | The same Interfaces header in the whole window |
| `12524-access-header-{light,dark}.png` | Access (OWD overview header): title, the writable "saved as draft" note, subtitle, Explain access at the right |

This branch is never merged; the feature branch carries no PNG.
