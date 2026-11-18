'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getMonthUsage, invalidateMonthUsage, shortModel, fmtDuration, fmtMoney, MONTHLY_CAP_USD } from '@/lib/usage';

type RangeKey = 'day' | 'week' | 'month';

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

interface UsageModalProps {
  open: boolean;
  onClose: () => void;
  ownerId: string | null;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function fmtDay(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(d);
}

function fmtTime(iso?: string | null): string {
  const t = new Date(iso ?? 0);
  if (Number.isNaN(t.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(t);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-base font-bold text-navy">{value}</span>
      <span className="block text-[11px] text-heroslate">{label}</span>
    </span>
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function UsageModal({ open, onClose, ownerId }: UsageModalProps) {
  const [month, setMonth] = useState<{ spend: number; runs: number; tokens: number; monthName: string } | null>(null);
  const [rows, setRows] = useState<Array<{
    id: string; delta?: number | null; reason?: string | null; createdAt?: string | null;
    p: { model?: string; provider?: string; kind?: string; inTokens?: number; outTokens?: number; tools?: number; durationMs?: number } | null;
  }> | null>(null);
  const [byModel, setByModel] = useState<Array<{
    model: string; provider: string; runs: number; inTokens: number; outTokens: number; tools: number; spend: number;
  }>>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [range, setRange] = useState<RangeKey>('week');

  useEffect(() => {
    if (!open || !ownerId) return;
    let alive = true;
    setRows(null);
    setMonth(null);
    setError('');
    void (async () => {
      try {
        const u = await getMonthUsage(ownerId);
        if (!alive) return;
        setMonth({ spend: u.spend, runs: u.runs, tokens: u.tokens, monthName: u.monthName });
        setRows(u.rows);
        setByModel(u.byModel);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Could not load usage');
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, ownerId, attempt]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const inWindow = (iso?: string | null): boolean => {
    const t = new Date(iso ?? 0).getTime();
    if (Number.isNaN(t)) return false;
    if (range === 'day') return t >= todayStart;
    const days = range === 'week' ? 7 : 30;
    return t >= todayStart - (days - 1) * 86400_000;
  };

  const scoped = (rows ?? []).filter((x) => inWindow(x.createdAt));
  const modelRows = scoped.filter((x) => x.p);
  const inT = modelRows.reduce((s, x) => s + (x.p?.inTokens ?? 0), 0);
  const outT = modelRows.reduce((s, x) => s + (x.p?.outTokens ?? 0), 0);
  const toolCalls = modelRows.reduce((s, x) => s + (x.p?.tools ?? 0), 0);

  // Tokens-per-bucket bar data (zero-filled so the chart reads professionally).
  interface Bucket {
    label: string;
    short: string;
    tokens: number;
  }
  let buckets: Bucket[] = [];
  let tickInterval = 0;
  if (range === 'day') {
    tickInterval = 5;
    for (let h = 0; h < 24; h++) {
      buckets.push({ label: `${h}:00`, short: `${h}:00`, tokens: 0 });
    }
    for (const { createdAt: c, p } of modelRows) {
      const t = new Date(c ?? 0).getTime();
      if (Number.isNaN(t) || t < todayStart) continue;
      const h = Math.min(23, Math.floor((t - todayStart) / 3600_000));
      buckets[h].tokens += (p?.inTokens ?? 0) + (p?.outTokens ?? 0);
    }
  } else {
    const days = range === 'week' ? 7 : 30;
    tickInterval = range === 'week' ? 0 : 4;
    for (let i = days - 1; i >= 0; i--) {
      const label = fmtDay(new Date(todayStart - i * 86400_000));
      buckets.push({ label, short: label.split(' ')[0], tokens: 0 });
    }
    for (const { createdAt: c, p } of modelRows) {
      const t = new Date(c ?? 0).getTime();
      if (Number.isNaN(t)) continue;
      const idx = Math.round((startOfDay(new Date(t)).getTime() - (todayStart - (days - 1) * 86400_000)) / 86400_000);
      if (idx < 0 || idx >= days) continue;
      buckets[idx].tokens += (p?.inTokens ?? 0) + (p?.outTokens ?? 0);
    }
  }

  const rangeNoun = range === 'day' ? 'today' : range === 'week' ? 'this week' : 'this month';
  const spend = month?.spend ?? 0;
  const pct = Math.min(100, (spend / MONTHLY_CAP_USD) * 100);
  const capped = spend >= MONTHLY_CAP_USD;
  const nextMonth = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const maxModelMetric = Math.max(0, ...byModel.map((b) => (spend > 0 ? b.spend : b.inTokens + b.outTokens)));

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Usage"
          >
            <div className="p-5 pb-3">
              <h3 className="font-brico text-lg font-bold text-navy">Usage</h3>
              {rows === null && !error ? (
                <p className="mt-3 text-3xl font-bold text-navy">…</p>
              ) : (
                <>
                  <p className="mt-1 text-3xl font-bold text-navy">
                    {fmtMoney(spend)}{' '}
                    <span className="text-base font-semibold text-heroslate">of ${MONTHLY_CAP_USD.toFixed(2)}</span>
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-heroslate">
                    Billed in {month?.monthName} · {month?.runs ?? 0} runs · {fmtTokens(month?.tokens ?? 0)} tokens
                  </p>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-ice"
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Monthly spend against cap"
                  >
                    <div
                      className={`h-full rounded-full transition-all ${capped ? 'bg-red-500' : pct >= 80 ? 'bg-bamber' : 'bg-blagoon'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {capped ? (
                    <p className="mt-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                      Monthly cap reached — new sends are paused until {nextMonth}.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] font-semibold text-heroslate">
                      {fmtMoney(MONTHLY_CAP_USD - spend)} left this month · cap resets 1 {nextMonth}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-ice p-1" role="tablist" aria-label="Usage range">
                    {RANGES.map((r) => (
                      <button
                        key={r.key}
                        role="tab"
                        aria-selected={range === r.key}
                        onClick={() => setRange(r.key)}
                        className={`rounded-full py-1.5 text-xs font-bold transition ${
                          range === r.key ? 'bg-navy text-white' : 'text-heroslate hover:text-navy'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4">
                    <Stat label="Tokens in" value={fmtTokens(inT)} />
                    <Stat label="Tokens out" value={fmtTokens(outT)} />
                    <Stat label="Tool calls" value={`${toolCalls}`} />
                  </div>
                </>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
              {rows === null && !error && <p className="py-4 text-center text-xs text-heroslate">Loading usage…</p>}
              {error && (
                <div className="py-4 text-center">
                  <p className="text-xs font-semibold text-red-600">{error}</p>
                  <button
                    onClick={() => {
                      if (ownerId) invalidateMonthUsage(ownerId);
                      setAttempt((a) => a + 1);
                    }}
                    className="mt-2 rounded-full bg-ice px-4 py-1.5 text-xs font-bold text-navy"
                  >
                    Retry
                  </button>
                </div>
              )}
              {rows !== null && scoped.length === 0 && !error && (
                <p className="py-4 text-center text-xs text-heroslate">No usage {rangeNoun}.</p>
              )}
              {rows !== null && scoped.length > 0 && (
                <>
                  <p className="mt-1 text-[11px] font-semibold text-heroslate">
                    Tokens per {range === 'day' ? 'hour' : 'day'} · {rangeNoun}
                  </p>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                          interval={tickInterval}
                          tickFormatter={(v: string) => v.split(' ')[0]}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          width={44}
                          tickFormatter={(v: number) => fmtTokens(v)}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(47,123,255,0.08)' }}
                          contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                          formatter={(value) => [`${fmtTokens(Number(value))} tokens`, 'Tokens']}
                        />
                        <Bar dataKey="tokens" fill="#2F7BFF" radius={[4, 4, 0, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {byModel.length > 0 && (
                    <>
                      <p className="mt-4 text-[11px] font-semibold text-heroslate">Spend by model · this month</p>
                      <ul className="mt-1.5 space-y-2">
                        {byModel.map((b) => {
                          const metric = spend > 0 ? b.spend : b.inTokens + b.outTokens;
                          return (
                            <li key={`${b.provider} ${b.model}`}>
                              <span className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="min-w-0 truncate font-bold text-navy" title={`${b.provider} ${b.model}`}>
                                  {b.model}
                                  <span className="ml-1.5 font-semibold text-heroslate">{b.provider}</span>
                                </span>
                                <span className="shrink-0 font-semibold text-heroslate">
                                  {b.runs} run{b.runs === 1 ? '' : 's'} · {fmtTokens(b.inTokens + b.outTokens)} · {fmtMoney(b.spend)}
                                </span>
                              </span>
                              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-ice">
                                <span
                                  className="block h-full rounded-full bg-cta"
                                  style={{ width: `${maxModelMetric > 0 ? (metric / maxModelMetric) * 100 : 0}%` }}
                                />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {spend === 0 && (
                        <p className="mt-1.5 text-[11px] text-heroslate">
                          Tokens only — current providers are unpriced, so nothing is billed yet.
                        </p>
                      )}
                    </>
                  )}
                  <p className="mt-4 text-[11px] font-semibold text-heroslate">Recent runs · this month</p>
                  <ul className="mt-1.5 divide-y divide-slate-100">
                    {(rows ?? []).slice(0, 8).map((r) => (
                      <li key={r.id} className="flex items-baseline justify-between gap-2 py-1.5 text-xs">
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-navy">{shortModel(r.p?.model)}</span>
                          <span className="block text-[11px] text-heroslate">
                            {fmtTime(r.createdAt)} · {r.p?.kind ?? 'run'} · {fmtDuration(r.p?.durationMs)}
                          </span>
                        </span>
                        <span className="shrink-0 text-right font-semibold text-heroslate">
                          {fmtTokens((r.p?.inTokens ?? 0) + (r.p?.outTokens ?? 0))} · {r.p?.tools ?? 0} tools
                          <span className="block font-bold text-navy">{fmtMoney(Math.abs(r.delta ?? 0))}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 p-4 pt-2">
              <p className="text-[11px] leading-snug text-heroslate">
                Early access: every account gets $1 free credit to try things out. Top-ups coming soon.
              </p>
              <button
                onClick={onClose}
                className="shrink-0 rounded-full bg-navy px-5 py-2 text-sm font-bold text-white hover:bg-[#1c3350]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
