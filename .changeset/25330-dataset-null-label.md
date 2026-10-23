---
"@object-ui/plugin-dashboard": patch
---

dashboard: a dataset chart draws its null bucket under the name the dataset declares for it (`fields[].nullLabel`, the dimension's `nullLabel` resolved by the server), over the global `chart.nullCategory` default. System Overview's "Events by User" now reads "System" for the rows the platform writes itself instead of "(None)". A column without one keeps the locale default, and a two-dimension pivot takes a declared name only when both dimensions declare the same one (objectstack#25330).
