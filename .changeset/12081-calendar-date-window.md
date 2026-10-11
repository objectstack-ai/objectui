---
'@object-ui/plugin-list': patch
'@object-ui/plugin-calendar': minor
---

A calendar view in a list draws every record of the days it shows, not the first 100 records of the object (objectui#12081 item 2).

A list view's calendar used to draw the rows of the list's one unpaged fetch: the first 100 records of the object, with no date condition. A month holding more than 100 matching records was drawn from whichever 100 came first, and the rest never appeared. The only sign was the list's "Showing first 100 records" note. Measured on a contracts calendar with 122 records: up to 22 were never drawn.

- **The list fetches the calendar's visible days.** The query selects the days on the calendar's start field, or, with an end field bound, every span that touches those days. It also selects the records with no start date, which the calendar counts as unscheduled. The view's own filter, the filter panel, the user filters and the search still narrow it.
- **It walks the window in steps of the fetch batch.** Every request asks for at most 100 records, the same batch as before. The list keeps asking until the window is exhausted, so every record of the month is drawn. It stops at the platform's non-grid ceiling of 2,000 records. It then draws the first 2,000 and shows a note under the calendar naming both numbers, the note the standalone calendar already shows. The "Showing first 100 records" note no longer appears on a calendar.
- **A declared page size no longer sizes a calendar's fetch.** On a calendar with a start date bound, every step is the fetch batch, whatever `pagination.pageSize` the view declares. A declared size still sizes the window of every other view, and of a calendar with no start date bound.
- **The rows-per-page picker is no longer offered on such a calendar.** A page size changes nothing it draws. The other views that offer it keep it.
- **Moving to another month fetches that month.** A move inside the window already fetched, such as switching to a week of the same month, fetches nothing. The calendar keeps drawing while the next window loads, and keeps the month it moved to.
- **Unchanged:** the grid's paging and its requests, every other view's one fetch batch, and a calendar with no start date bound. A calendar rendered on its own, outside a list, still fetches as before.

**Clause-②: yes (widening)** — `ObjectCalendarComponentProps` gains one optional member, `onVisibleRangeChange?: (range: { start: Date; end: Date }) => void`. `ObjectCalendar` calls it on mount and whenever navigation or a view change moves the days it draws. `start` is local midnight of the first day drawn and `end` local midnight of the day after the last. The `object-calendar` renderer forwards it from a host, like the other callbacks, only when the value is a function. Nothing else on either package entry changes: no export is added or removed, no existing member changes type, and no locale key is added.
