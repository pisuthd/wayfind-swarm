'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Maximize2, TerminalSquare } from 'lucide-react';
import { previewLink } from '@/lib/agent';

type PreviewTab = 'live' | 'build';

/** Preview row: signed one-click links to the live dev server (Live tab,
 * ?port=, default 5173) or a built folder served by the agent (Build tab,
 * /preview/<folder>/). Links are short-lived (15 min) — minted fresh per
 * click, so there is nothing to store. */
function PreviewRow() {
  const [tab, setTab] = useState<PreviewTab>('live');
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const open = async (copy: boolean) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const t = target.trim() || (tab === 'live' ? '5173' : '');
      if (!t) {
        setError('Enter a folder name first.');
        return;
      }
      const { url } = await previewLink(tab === 'live' ? 'dev' : 'preview', t);
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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-ice p-1" role="tablist" aria-label="Preview source">
        {(['live', 'build'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setTarget('');
              setError('');
            }}
            className={`rounded-full py-1 text-xs font-bold transition ${
              tab === t ? 'bg-navy text-white' : 'text-heroslate hover:text-navy'
            }`}
          >
            {t === 'live' ? 'Live server' : 'Build folder'}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void open(false);
          }}
          placeholder={tab === 'live' ? 'Port (default 5173)' : 'Folder (e.g. todo-app/dist)'}
          inputMode={tab === 'live' ? 'numeric' : undefined}
          aria-label={tab === 'live' ? 'Dev server port' : 'Built folder'}
          className="min-w-0 flex-1 rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy outline-none placeholder:text-slate-400 focus:border-cta"
        />
        <button
          onClick={() => void open(false)}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cta px-4 py-2 text-sm font-bold text-white hover:bg-ctahover disabled:opacity-50"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
          {busy ? '…' : 'Open'}
        </button>
        <button
          onClick={() => void open(true)}
          disabled={busy}
          aria-label="Copy preview link"
          title="Copy preview link (valid 15 minutes)"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-heroslate hover:bg-slate-200 disabled:opacity-50"
        >
          {copied ? <Check className="h-4 w-4 text-blagoon" strokeWidth={2.2} /> : <Copy className="h-4 w-4" strokeWidth={2.2} />}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-heroslate">
        {tab === 'live'
          ? 'Opens the dev server running on the computer (start it from chat first).'
          : 'Opens a production build served from the workspace.'}
      </p>
    </div>
  );
}

export default function TabConsole({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-navy/20 bg-white/60 p-5 text-center">
        <TerminalSquare className="mx-auto h-6 w-6 text-heroslate" strokeWidth={2} />
        <p className="mt-3 text-sm leading-relaxed text-ink">
          One computer, every bot. Open a live shell.
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          <Maximize2 className="h-4 w-4" strokeWidth={2.2} />
          Open terminal
        </button>
      </div>
      <PreviewRow />
    </div>
  );
}
