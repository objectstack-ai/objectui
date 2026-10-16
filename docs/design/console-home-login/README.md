# Console login page, home page and app bar · design artboards · 2026-10-16

Three artboards the maintainer approved on 2026-10-16, as static HTML (the accent resolved to `#4f46e5`; every declaration maps to one Tailwind utility) and a 1280 px PNG render of each. This branch is a temporary evidence branch: it is never merged, and the cards below reference these files by commit. The maintainer ruled that design files and screenshots do not enter main.

| File | Shows | Card |
| --- | --- | --- |
| `Login.html` / `Login.png` (1280 × 820) | the login page, refined centred version: one accent, "欢迎回来" card, SSO slot, quiet dev-admin row, footer | the login page card |
| `Home.html` / `Home.png` (1280 × 1040) | the home page in four sections: top bar with search, greeting with a work summary and compact builder chips, 56 px app tiles, My work (approvals first), recently accessed beside the activity feed | the three home cards |
| `AppBar.html` / `AppBar.png` (1280 × 460) | today's in-app bar above the proposed one, with the app menu open | the app bar card |

Numbers shared by the three: product mark tile 28–36 px on `--primary`; 8 px radius on cards, inputs and chips (12 px on the login card); 40 px rows and inputs; headings 15 px / 600; body 13 px; meta 12 px; the console's existing `--primary` token everywhere an accent appears.
