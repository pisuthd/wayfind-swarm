'use client';

import { generateClient } from 'aws-amplify/data';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Untyped data client: the generated Schema lives in wayfind-cloud (backend
// package — not importable from a frontend). Runtime model access comes from
// amplify_outputs.json, which this frontend shares with the backend.
// `any` is deliberate — only documented CreditLedger fields are read.
let client: any = null;

function dataClient(): any {
  if (!client) client = generateClient();
  return client;
}

/** Monthly billed-spend cap per user (USD). Frontend-enforced: the send gate
 * in AppShell refuses new runs once this month's billed total reaches it.
 * Bypassable via direct API calls — backend enforcement is a follow-up. */
export const MONTHLY_CAP_USD = 1;

export interface ParsedUsage {
  model?: string;
  kind?: string;
  inTokens?: number;
  outTokens?: number;
  tools?: number;
  provider?: string;
  durationMs?: number;
}

/** Reason lines look like: model usage run=<id> provider=… model=… kind=chat
 * 320 chars tokens=144261in/1055out tools=7 durationMs=1696 — parse them into
 * stats; anything else only counts toward billing. */
export function parseReason(reason?: string | null): ParsedUsage | null {
  if (!reason || !reason.startsWith('model usage ')) return null;
  const str = (re: RegExp): string | undefined => {
    const m = reason.match(re);
    return m ? m[1] : undefined;
  };
  const num = (re: RegExp): number | undefined => {
    const m = reason.match(re);
    return m ? Number(m[1]) : undefined;
  };
  const tokens = reason.match(/tokens=(\d+)in\/(\d+)out/);
  return {
    provider: str(/provider=(\S+)/),
    model: str(/model=(\S+)/),
    kind: str(/kind=(\S+)/),
    inTokens: tokens ? Number(tokens[1]) : undefined,
    outTokens: tokens ? Number(tokens[2]) : undefined,
    tools: num(/tools=(\d+)/),
    durationMs: num(/durationMs=(\d+)/),
  };
}

export interface LedgerRow {
  id: string;
  delta?: number | null;
  reason?: string | null;
  createdAt?: string | null;
  runId?: string | null;
}

export interface ModelBreakdown {
  model: string;
  provider: string;
  runs: number;
  inTokens: number;
  outTokens: number;
  tools: number;
  spend: number;
}

export interface MonthUsage {
  spend: number;
  runs: number;
  tokens: number;
  rows: Array<LedgerRow & { p: ParsedUsage | null }>;
  byModel: ModelBreakdown[];
  monthName: string;
}

/** Shorten a model id for display: strip org prefixes and version suffixes. */
export function shortModel(model?: string): string {
  if (!model || model === '?') return 'unknown';
  const base = model.split('/').pop() ?? model;
  return base.replace(/-\d{4,}.*$/, '').replace(/-flash.*$/i, '-flash');
}

export function fmtMoney(v: number): string {
  const a = Math.abs(v);
  return `$${a.toFixed(a < 1 ? 3 : 2)}`;
}

export function fmtDuration(ms?: number): string {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

/** Fetch every ledger row for the owner (paginated, up to 10 pages) and
 * aggregate this calendar month. Results are cached 60s per owner so the
 * send gate stays off the network hot path. */
const cache = new Map<string, { at: number; val: MonthUsage }>();
const CACHE_MS = 60_000;

export function invalidateMonthUsage(ownerId: string): void {
  cache.delete(ownerId);
}

export async function getMonthUsage(ownerId: string): Promise<MonthUsage> {
  const hit = cache.get(ownerId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.val;

  const rows: LedgerRow[] = [];
  let nextToken: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const { data, errors, nextToken: nt } = await dataClient().models.CreditLedger.ledgerByOwnerId(
      { ownerId },
      { limit: 100, ...(nextToken ? { nextToken } : {}) },
    );
    if (errors?.length) throw new Error(errors.map((e: any) => e.message).join('; '));
    rows.push(...((data ?? []) as LedgerRow[]));
    nextToken = nt ?? undefined;
    if (!nextToken) break;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthRows = rows
    .map((row) => ({ ...row, p: parseReason(row.reason) }))
    .filter((x) => {
      const t = new Date(x.createdAt ?? 0).getTime();
      return !Number.isNaN(t) && t >= monthStart;
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const byModelMap = new Map<string, ModelBreakdown>();
  for (const x of monthRows) {
    const key = `${x.p?.provider ?? '?'} ${shortModel(x.p?.model)}`;
    const cur =
      byModelMap.get(key) ??
      { model: shortModel(x.p?.model), provider: x.p?.provider ?? '?', runs: 0, inTokens: 0, outTokens: 0, tools: 0, spend: 0 };
    cur.runs += 1;
    cur.inTokens += x.p?.inTokens ?? 0;
    cur.outTokens += x.p?.outTokens ?? 0;
    cur.tools += x.p?.tools ?? 0;
    cur.spend += Math.abs(x.delta ?? 0);
    byModelMap.set(key, cur);
  }

  const val: MonthUsage = {
    spend: Math.abs(monthRows.reduce((sum, x) => sum + (x.delta ?? 0), 0)),
    runs: monthRows.length,
    tokens: monthRows.reduce((s, x) => s + (x.p?.inTokens ?? 0) + (x.p?.outTokens ?? 0), 0),
    rows: monthRows,
    byModel: [...byModelMap.values()].sort((a, b) => b.spend - a.spend || b.inTokens + b.outTokens - (a.inTokens + a.outTokens)),
    monthName: new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(now),
  };
  cache.set(ownerId, { at: Date.now(), val });
  return val;
}
