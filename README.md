# InsightFlow

Drop a CSV → InsightFlow infers each field's type, picks a sensible chart, surfaces KPIs, and lets you export. Runs entirely client-side — no data leaves the browser.

**[Live demo →](https://insightflow-00brod.vercel.app)**

## What it does

- **Field-type inference** — every column classified as `quantitative`, `temporal`, or `nominal` from value patterns (numeric share, date parsing, cardinality), not header names.
- **Automatic chart selection** — picks bar / line / scatter / histogram based on the field-type mix, and shows *why* (e.g. "time field + metric → trend over time").
- **KPI cards** — row/field counts plus totals and averages on the first metric.
- **Export** — chart to PNG (2×), working data to CSV.
- **Bundled sample** — synthetic 60-day marketing dataset (spend / impressions / clicks / conversions / revenue across 5 channels) so the demo works with zero setup.

## How the inference works

`src/lib/analyze.ts` is the engine:

1. `detectFields()` — samples each column. `>80%` parseable dates → temporal; `>80%` numeric → quantitative; else nominal. Tracks uniqueness + missing.
2. `pickChart()` — heuristic mirroring how an analyst reads a fresh table: temporal+metric → line, two metrics → scatter, category+metric → bar, lone metric → histogram.
3. `toVegaSpec()` — compiles the choice into a [Vega-Lite](https://vega.github.io/vega-lite/) v5 spec.

Parsing (`src/lib/csv.ts`) is a dependency-free RFC-4180-ish reader (quoted fields, embedded commas/newlines).

## Stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite |
| Charts | Vega-Lite v5 (via vega-embed) |
| Styling | Tailwind CSS |

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## License

MIT © Brian Rodriguez
