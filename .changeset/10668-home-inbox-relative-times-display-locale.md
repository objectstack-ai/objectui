---
'@object-ui/app-shell': patch
---

The relative timestamps on Home and in the inbox bell now follow the display locale, not the UI language (objectui#10668).

Home's action centre and activity card, and the bell's notification rows, notification groups and
activity rows, take their locale from `useDisplayLocale()` instead of the UI language. The
Marketplace's and Studio home's relative times already did. With an English UI and a `de-CH` display
locale, a notification from three days ago now reads `vor 3 Tagen`, where it used to read
`3 days ago`. With no display locale declared, the display locale falls back to the UI language, so
these timestamps render as before.
