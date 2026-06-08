import { useMemo, useRef, useState } from 'react';
import type { Result } from 'vega-embed';
import { parseCSV, toCSV } from './lib/csv';
import { detectFields, pickChart, toVegaSpec, kpis, type Row, type FieldType } from './lib/analyze';
import { sampleData } from './lib/sample';
import { Chart } from './components/Chart';

const TYPE_STYLE: Record<FieldType, string> = {
  quantitative: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  temporal: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  nominal: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
};

export default function App() {
  const [rows, setRows] = useState<Row[]>(() => sampleData());
  const [name, setName] = useState('marketing_sample.csv');
  const viewRef = useRef<Result | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fields = useMemo(() => detectFields(rows), [rows]);
  const choice = useMemo(() => pickChart(fields), [fields]);
  const spec = useMemo(() => (choice ? toVegaSpec(choice, rows) : null), [choice, rows]);
  const cards = useMemo(() => kpis(rows, fields), [rows, fields]);

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseCSV(String(reader.result));
      if (parsed.length) { setRows(parsed); setName(f.name); }
      else alert('Could not parse that CSV — needs a header row and at least one data row.');
    };
    reader.readAsText(f);
  };

  const exportPNG = async () => {
    if (!viewRef.current) return;
    const url = await viewRef.current.view.toImageURL('png', 2);
    download(url, 'insightflow-chart.png');
  };
  const exportCSV = () => {
    const blob = new Blob([toCSV(rows)], { type: 'text/csv' });
    download(URL.createObjectURL(blob), name.replace(/\.csv$/, '') + '_export.csv');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Insight<span className="text-accent">Flow</span>
          </h1>
          <p className="text-sm text-slate-400">Drop a CSV. It detects field types and picks the right chart.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-accent text-ink font-semibold text-sm hover:brightness-110 transition">
            Upload CSV
          </button>
          <button onClick={() => { setRows(sampleData()); setName('marketing_sample.csv'); }}
            className="px-4 py-2 rounded-lg bg-panel border border-edge text-slate-300 text-sm hover:border-slate-500 transition">
            Load sample
          </button>
          <input ref={fileRef} type="file" accept=".csv" hidden
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cards.map((k) => (
          <div key={k.label} className="bg-panel border border-edge rounded-xl p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{k.label}</div>
            <div className="text-xl font-bold text-white mt-1 truncate">{k.value}</div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-panel border border-edge rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-white">Auto chart</div>
              {choice && <div className="text-xs text-slate-500">{choice.reason}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={exportPNG} className="text-xs px-3 py-1.5 rounded-md border border-edge text-slate-300 hover:border-slate-500">PNG</button>
              <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-md border border-edge text-slate-300 hover:border-slate-500">CSV</button>
            </div>
          </div>
          {spec ? <Chart spec={spec} onView={(r) => (viewRef.current = r)} />
            : <div className="text-slate-500 text-sm py-20 text-center">No chartable fields detected.</div>}
        </div>

        <div className="bg-panel border border-edge rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-3">Detected fields · <span className="text-slate-500">{name}</span></div>
          <ul className="space-y-2">
            {fields.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-slate-300 truncate">{f.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${TYPE_STYLE[f.type]}`}>{f.type}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-edge text-xs text-slate-500 leading-relaxed">
            {fields.filter((f) => f.type === 'quantitative').length} numeric ·{' '}
            {fields.filter((f) => f.type === 'temporal').length} date ·{' '}
            {fields.filter((f) => f.type === 'nominal').length} categorical
          </div>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-600">
        Built with React · TypeScript · Vega-Lite · Tailwind — runs entirely in your browser, no upload leaves the page.
      </footer>
    </div>
  );
}

function download(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
}
