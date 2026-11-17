'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Globe, Monitor, Terminal } from 'lucide-react';
import { previewLink } from '@/lib/agent';
import { useComputer } from '../Roster/useComputer';

/** Live-preview row: a port field plus Open + copy. Links are short-lived
 * (15 min) — minted fresh per click, so there is nothing to store. */
function PreviewRow() {
  const [port, setPort] = useState('5173');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const open = async (copy: boolean) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const { url } = await previewLink('dev', port.trim() || '5173');
      if (copy) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mint preview link');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Live preview</p>
      <div className="mt-2 flex gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-navy/15 bg-white px-3 py-2">
          <Globe className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={2} />
          <input
            value={port}
            onChange={(e) => setPort(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void open(false);
            }}
            placeholder="5173"
            inputMode="numeric"
            aria-label="Dev server port"
            className="w-full bg-transparent text-sm text-navy outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={() => void open(false)}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cta px-4 py-2 text-sm font-bold text-white hover:bg-ctahover disabled:opacity-50"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
          {busy ? '…' : 'Open'}
        </button>
        <button
          onClick={() => void open(true)}
          disabled={busy}
          aria-label="Copy preview link"
          title="Copy preview link (valid 15 minutes)"
          className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-xl bg-slate-100 text-heroslate hover:bg-slate-200 disabled:opacity-50"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.2} /> : <Copy className="h-4 w-4" strokeWidth={2.2} />}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-heroslate">Start the dev server from chat first, then open it here.</p>
    </div>
  );
}

export default function TabConsole({ onOpen }: { onOpen: () => void }) {
  const { computer, busy } = useComputer();
  const status = computer?.provisionStatus ?? null;
  const online = status === 'running';
  const asleep = status === 'suspended';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white">
            <Monitor className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-sm font-bold text-navy">Computer</p>
            <p className="text-xs text-heroslate">bash · Alpine Linux</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            online
              ? 'bg-emerald-50 text-emerald-600'
              : asleep
                ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              online ? 'bg-emerald-500' : asleep ? 'bg-amber-500' : busy ? 'animate-pulse bg-slate-400' : 'bg-slate-300'
            }`}
          />
          {online ? 'Online' : asleep ? 'Asleep' : busy ? 'Starting' : 'Off'}
        </span>
      </div>

      <div className="my-4 h-px bg-slate-100" />

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Terminal</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-sm font-bold text-white hover:opacity-90"
      >
        <Terminal className="h-4 w-4" strokeWidth={2.2} />
        Open terminal
      </button>

      <div className="mt-4">
        <PreviewRow />
      </div>
    </div>
  );
}
