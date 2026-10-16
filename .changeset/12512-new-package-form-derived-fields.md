---
'@object-ui/app-shell': patch
---

New package dialog: the display name is now the first field, and the Package ID, Object namespace and Version follow it in the same Basics card. Each of the three says it was filled in for you until you edit it, and clicking into one selects its whole value, so typing replaces it instead of being appended to it. Create package stays disabled until the ID, name, namespace and version are valid, and an empty ID or namespace now says why under the field.
