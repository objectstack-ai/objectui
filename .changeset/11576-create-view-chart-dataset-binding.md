---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The console's Create View dialog now creates chart views the platform accepts (objectui#11576).

The dialog wrote a chart view as `chart: { chartType, xAxisField, yAxisFields }`, the inline
axes `@objectstack/spec` retired under ADR-0021. The spec's list chart block refuses those two
keys by name and requires `dataset` and `values`, so the platform's view write door refused
every chart view created from the console, from both "Save as view" and the view tab bar's
add button. The dialog had already closed, so the user saw nothing happen.

The chart type now binds a semantic-layer dataset instead:

- the dialog offers the ADR-0021 datasets whose base `object` is the view's own object, and
  only those;
- it then offers the chosen dataset's measures (`values`) and, when the dataset declares any,
  its dimensions (`dimensions`, optional);
- an object that exposes no dataset shows the chart type as unavailable, with its own reason.

The payload is `chart: { chartType, dataset, values, dimensions? }`, with no second spelling.
The dataset catalog reader the dashboard and report editors use now also carries each dataset's
base `object`.

In `@object-ui/i18n`, the four `console.objectView` axis labels (`xAxisField`, `xAxisFieldHelp`,
`yAxisField`, `yAxisFieldHelp`) leave all ten packs, and eight keys label the dataset, measure
and dimension picks (`dataset`, `datasetHelp`, `chartMeasure`, `chartMeasureHelp`,
`chartDimension`, `chartDimensionHelp`, `viewTypeUnavailableDataset`, `noDatasetMeasure`).
