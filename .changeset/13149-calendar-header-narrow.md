---
'@object-ui/plugin-calendar': patch
---

The calendar header's date title no longer clips at phone widths (objectui#13149). At 390px the day view's title was cut by the container edge ("Tuesday, October 20, 2") with no ellipsis. The title and its button can now shrink and truncate with an ellipsis, the button's tooltip holds the full date, and below the `sm` breakpoint the header shows a short form of the same locale-aware format ("Tue, Oct 20" in the day view, "Oct 18 - Oct 24" in the week view, "Oct 2026" in the month view). From `sm` up the full title is unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
