---
'@object-ui/app-shell': patch
---

Studio's automation canvas header names the open flow by its label, not by the metadata type word (objectui#11665, the residual of objectui#11659 ruling 6).

With a flow open, the header printed the literal chip `flow · NAME` in every language, so a Chinese author read an English type word and an API name next to the pillar's plain-language copy. The header now prints the flow's label, the same string its row in the rail prints; a label that resolves to nothing falls back to the API name. The API name is kept for the authors who need it, on the chip's tooltip, headed by the designer's existing "API name" row (`API name` in English, `API 名称` in Chinese).

Nothing is added to the package entry: no export, prop, type member or language-pack key.
