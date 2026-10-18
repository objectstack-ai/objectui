---
'@object-ui/plugin-kanban': patch
'@object-ui/i18n': patch
---

The kanban board's card lists and drag overlay are now named in the viewer's language. A lane's card list, a swimlane cell's card list and the drag overlay used English templates around the label ("To do cards", "To do - ann cards", "Dragging Content backlog"), so under zh a screen reader heard "待规划 cards". Each name is now one pack sentence with the label interpolated (`kanban.columnCards`, `kanban.laneCards`, `kanban.dnd.dragging`), in all ten language packs. English reads as before.
