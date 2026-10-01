# @object-ui/plugin-timeline

Timeline component plugin for Object UI with support for vertical, horizontal, and Gantt-style timelines.

## Installation

```bash
npm install @object-ui/plugin-timeline
```

## Usage

### Vertical Timeline

```tsx
import {
  Timeline,
  TimelineItem,
  TimelineMarker,
  TimelineContent,
  TimelineTitle,
  TimelineTime,
  TimelineDescription
} from '@object-ui/plugin-timeline';

function App() {
  return (
    <Timeline>
      <TimelineItem>
        <TimelineMarker variant="success" />
        <TimelineContent>
          <TimelineTime>2024-01-15</TimelineTime>
          <TimelineTitle>Project Started</TimelineTitle>
          <TimelineDescription>
            Kickoff meeting and initial planning
          </TimelineDescription>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
}
```

### Gantt Timeline

```tsx
import {
  TimelineGantt,
  TimelineGanttHeader,
  TimelineGanttRow,
  TimelineGanttBar
} from '@object-ui/plugin-timeline';

// See examples in the source code for Gantt usage
```

## Schema-Driven Usage

This plugin automatically registers with ObjectUI's component registry when imported:

```tsx
import '@object-ui/plugin-timeline';

const schema = {
  type: 'timeline',
  variant: 'vertical',
  items: [
    {
      time: '2024-01-15',
      title: 'Project Started',
      description: 'Kickoff meeting',
      variant: 'success'
    }
  ]
};
```

### Object-bound timeline (`object-timeline`)

`object-timeline` fetches records from `objectName` and draws one entry per
record, from the fields its `timeline` config names. An authored node takes its
props in the `properties` bag, where `@objectstack/spec`'s
`ComponentPropsMap['object-timeline']` row declares them:

```json
{
  "type": "object-timeline",
  "properties": {
    "objectName": "project_task",
    "timeline": { "startDateField": "start_date", "titleField": "name" },
    "navigation": { "mode": "drawer" }
  }
}
```

`navigation` is what an entry click opens — the spec's `NavigationConfig` by
reference, `ViewNavigationConfig` in `@object-ui/types`: `mode` (`page`,
`drawer`, `modal`, `split`, `popover`, `new_window` or `none`) with `size`,
`openNewTab` and `preventNavigation`. `drawer`, `modal` and `popover` open the
entry's record in that overlay, `new_window` and `openNewTab: true` open the
record page in a new tab, `preventNavigation: true` opens nothing, and `size`
sets the overlay width. A click handler from a parent view outranks the whole
key. ⚠️ Write the block with `mode`: with the key absent, or with a block
written without `mode` (it takes the spec's `page` default), a click opens
nothing on a timeline no parent view navigates for (objectui#11293). `split`
opens nothing on this block either, because the timeline gives the split shell
no main panel.

## Links

- 📚 [Documentation](https://www.objectui.org/docs/plugins/plugin-timeline)
- 📦 [npm package](https://www.npmjs.com/package/@object-ui/plugin-timeline)
- 📝 [Changelog](./CHANGELOG.md)
- 🐛 [Report an issue](https://github.com/objectstack-ai/objectui/issues)
- 🤝 [Contributing Guide](https://github.com/objectstack-ai/objectui/blob/main/CONTRIBUTING.md)
- 🗺️ [Roadmap](https://github.com/objectstack-ai/objectui/blob/main/ROADMAP.md)

## License

MIT © ObjectStack Inc.
