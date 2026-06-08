import type { Row } from './analyze';

// Synthetic but realistic marketing-spend dataset for the portfolio demo.
// Daily rows across channels with spend, impressions, clicks, conversions, revenue.
export function sampleData(): Row[] {
  const channels = ['Paid Search', 'Paid Social', 'Email', 'Organic', 'Display'];
  const rows: Row[] = [];
  const start = new Date('2026-01-01');
  for (let d = 0; d < 60; d++) {
    const date = new Date(start.getTime() + d * 864e5);
    const iso = date.toISOString().slice(0, 10);
    for (const channel of channels) {
      const base = { 'Paid Search': 1200, 'Paid Social': 900, Email: 200, Organic: 0, Display: 600 }[channel]!;
      const spend = Math.round(base * (0.7 + Math.random() * 0.6));
      const ctr = 0.01 + Math.random() * 0.04;
      const impressions = Math.round((spend + 50) * (8 + Math.random() * 6));
      const clicks = Math.round(impressions * ctr);
      const cr = 0.02 + Math.random() * 0.06;
      const conversions = Math.round(clicks * cr);
      const revenue = Math.round(conversions * (40 + Math.random() * 80));
      rows.push({ date: iso, channel, spend, impressions, clicks, conversions, revenue });
    }
  }
  return rows;
}
