---
"@object-ui/app-shell": patch
"@object-ui/i18n": patch
---

Setup refusals lead with one plain sentence. The Packages sheet, the metadata editor's error banner (Positions and every other metadata type) and the action parameter dialog (OAuth application registration among them) now show the first sentence of the server's message, without a leading bracketed code or field path and without the trailing declared code. The whole message, byte for byte, sits behind a "More" toggle with a copy button. A one-sentence message renders as before. New `refusalDetails.*` strings in all ten locale packs (objectui#13332).
