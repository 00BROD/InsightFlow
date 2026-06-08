// Core inference engine: detect field types from raw rows, then pick a sensible chart.
// This is the heart of InsightFlow — everything else is presentation.

export type FieldType = 'quantitative' | 'temporal' | 'nominal';
export type Row = Record<string, string | number | null>;

export interface Field {
  name: string;
  type: FieldType;
  unique: number;
  missing: number;
}

const DATE_RX = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;

const isNum = (v: unknown) => v !== '' && v !== null && !isNaN(Number(v));
const isDate = (v: unknown) => typeof v === 'string' && DATE_RX.test(v.trim()) && !isNaN(Date.parse(v));

export function detectFields(rows: Row[]): Field[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).map((name) => {
    const vals = rows.map((r) => r[name]);
    const present = vals.filter((v) => v !== '' && v !== null && v !== undefined);
    const numShare = present.filter(isNum).length / (present.length || 1);
    const dateShare = present.filter(isDate).length / (present.length || 1);
    let type: FieldType = 'nominal';
    if (dateShare > 0.8) type = 'temporal';
    else if (numShare > 0.8) type = 'quantitative';
    return {
      name,
      type,
      unique: new Set(present.map(String)).size,
      missing: rows.length - present.length,
    };
  });
}

export interface ChartChoice {
  mark: 'bar' | 'line' | 'point' | 'arc';
  x: Field;
  y?: Field;
  reason: string;
}

// Heuristic chart picker — mirrors how an analyst reads a fresh dataset.
export function pickChart(fields: Field[]): ChartChoice | null {
  const q = fields.filter((f) => f.type === 'quantitative');
  const t = fields.filter((f) => f.type === 'temporal');
  const n = fields.filter((f) => f.type === 'nominal');

  if (t.length && q.length)
    return { mark: 'line', x: t[0], y: q[0], reason: 'Time field + metric → trend over time' };
  if (q.length >= 2)
    return { mark: 'point', x: q[0], y: q[1], reason: 'Two metrics → scatter to read correlation' };
  if (n.length && q.length)
    return { mark: 'bar', x: n[0], y: q[0], reason: 'Category + metric → bar to compare groups' };
  if (q.length === 1)
    return { mark: 'bar', x: q[0], reason: 'Single metric → histogram of its distribution' };
  return null;
}

// Build a Vega-Lite spec from the chart choice. Histogram = binned single quantitative.
export function toVegaSpec(choice: ChartChoice, data: Row[]) {
  const base: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    background: 'transparent',
    data: { values: data },
    width: 'container',
    height: 320,
    config: {
      axis: { labelColor: '#94a3b8', titleColor: '#cbd5e1', gridColor: '#1f2937', domainColor: '#334155' },
      view: { stroke: 'transparent' },
    },
  };
  if (choice.mark === 'bar' && !choice.y) {
    return { ...base, mark: { type: 'bar', color: '#6ee7b7' },
      encoding: { x: { field: choice.x.name, bin: true, type: 'quantitative' }, y: { aggregate: 'count', type: 'quantitative' } } };
  }
  // Aggregate the metric so a time series collapses to one value per bucket
  // (raw rows across categories would otherwise draw a sawtooth, not a trend).
  const aggregate = choice.mark === 'line' || choice.mark === 'bar' ? 'sum' : undefined;
  const enc: any = {
    x: { field: choice.x.name, type: choice.x.type, ...(choice.x.type === 'temporal' ? { timeUnit: 'yearmonthdate' } : {}) },
    y: { field: choice.y!.name, type: 'quantitative', aggregate, title: aggregate ? `${aggregate} of ${choice.y!.name}` : choice.y!.name },
  };
  return { ...base, mark: { type: choice.mark, color: '#6ee7b7', point: choice.mark === 'line', filled: true, tooltip: true },
    encoding: enc };
}

export interface Kpi { label: string; value: string }

export function kpis(rows: Row[], fields: Field[]): Kpi[] {
  const out: Kpi[] = [{ label: 'Rows', value: rows.length.toLocaleString() }];
  out.push({ label: 'Fields', value: String(fields.length) });
  const q = fields.filter((f) => f.type === 'quantitative')[0];
  if (q) {
    const nums = rows.map((r) => Number(r[q.name])).filter((v) => !isNaN(v));
    const sum = nums.reduce((a, b) => a + b, 0);
    out.push({ label: `Total ${q.name}`, value: fmt(sum) });
    out.push({ label: `Avg ${q.name}`, value: fmt(sum / (nums.length || 1)) });
  }
  return out;
}

const fmt = (n: number) =>
  Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : n.toFixed(2);
