---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's app designer canvas shows a locale-map nav label and renames only the current locale's entry (objectui#11128)

The spec types a navigation item's `label` as `I18nLabel`: a plain string or an
inline locale map such as `{ en: 'Accounts', 'zh-CN': '客户' }`. The app
designer's nav canvas (`AppNavCanvas`, the design-mode editor inside the app
preview and the Studio app pillar) read the label only when it was a string:

- **Display.** A map-labelled entry read as the positional "Item 1", while the
  preview's landing line beside it already showed the resolved text. The card
  now resolves the label in the designer locale through the spec's own
  `resolveI18nLabel`, the resolver the preview uses.
- **Rename.** An inline rename wrote `{ ...item, label: 'typed text' }`, which
  replaced the whole map with one string and deleted every other language's
  text. A rename of a map now writes the designer locale's entry only and keeps
  every other entry. The entry written is the one the resolver reads first for
  that locale: the exact tag, else its bare language (`en` under the English
  designer), so the card shows the new text straight away. A map with neither
  gains an entry under the designer locale's tag. A plain-string label still
  renames to a plain string.
- **Fallback.** "Item N" is kept only for a label that is truly absent, and it
  now reads a designer catalogue row (`engine.appNav.item`), so it is Chinese
  under zh-CN. The English text is unchanged.
