'use client';

import { TerminalSquare } from 'lucide-react';

export default function TabConsole() {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-navy/20 bg-white/60 p-5 text-center">
        <TerminalSquare className="mx-auto h-6 w-6 text-heroslate" strokeWidth={2} />
        <p className="mt-3 font-bold text-navy">Terminal lands here in Phase 3</p>
        <p className="mt-1 text-xs leading-relaxed text-heroslate">
          A live shell into this bot&apos;s computer, right beside its settings.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-navy/10 bg-white p-2 opacity-60">
        <input
          disabled
          placeholder="$ coming soon…"
          className="w-full rounded-xl bg-transparent px-4 py-3 font-mono text-sm text-navy outline-none placeholder:text-slate-400"
        />
        <span className="shrink-0 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">→</span>
      </div>
    </div>
  );
}
