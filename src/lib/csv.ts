import type { Row } from './analyze';

// Minimal RFC-4180-ish CSV parser (quoted fields, embedded commas/quotes). No deps.
export function parseCSV(text: string): Row[] {
  const rows: string[][] = [];
  let field = '', record: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { record.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (field !== '' || record.length) { record.push(field); rows.push(record); record = []; field = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
    } else field += c;
  }
  if (field !== '' || record.length) { record.push(field); rows.push(record); }
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, coerce(r[i] ?? '')])) as Row,
  );
}

const coerce = (v: string) => {
  const t = v.trim();
  if (t !== '' && !isNaN(Number(t))) return Number(t);
  return t;
};

export function toCSV(rows: Row[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}
