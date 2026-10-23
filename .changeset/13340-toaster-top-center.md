---
'@object-ui/app-shell': patch
---

Console toasts no longer cover the page header's actions (objectui#13340). With no drawer open the toaster now sits top-centre, just below the console's top bar, instead of in the top-right corner, which is where every page header puts its actions. At 1440×900 a toast used to cover a list's New and Import buttons for its whole 4 s life. While a right-side drawer is open the toaster still goes to the top-right corner and steps clear of the drawer as before (objectui#11685), and it still never uses the bottom-right corner, which belongs to the assistant (objectui#7482).

New tests check that one server refusal raises one error toast, on the record form renderer and on an action's parameter dialog (Users → Create User, Teams → Add Member).
