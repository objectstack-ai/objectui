import enterpriseTable from './data-display/enterprise-table.json';
import dataTableSimple from './data-display/data-table-simple.json';
import calendarView from './data-display/calendar-view.json';

export const dataDisplay = {
  'enterprise-table': JSON.stringify(enterpriseTable, null, 2),
  'data-table-simple': JSON.stringify(dataTableSimple, null, 2),
  'calendar-view': JSON.stringify(calendarView, null, 2)
};
