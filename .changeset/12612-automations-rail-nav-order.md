---
'@object-ui/app-shell': patch
---

The Studio's Automations rail orders its object groups the way the package's app presents its objects (objectui#12612). The groups used to follow the alphabet of the object labels, so each language put the same object somewhere else: HotCRM's English rail opened with Account and its Chinese rail with 报价单 (Quote).

- **The navigation decides.** The groups follow the order in which the package's app navigation lists its objects, with every group of the navigation opened and each object counted at its first entry. For HotCRM: Lead, Account, Contact, Opportunity, Quote, Contract, Task, Campaign, Forecast.
- **Objects the navigation does not list come next**, the one with more flows first, then by label, then by API name. Without an app every group is ordered this way.
- **"No object" stays last.**
- **The order is the same in every language** wherever the navigation decides it. Which group a flow belongs to has not changed.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
