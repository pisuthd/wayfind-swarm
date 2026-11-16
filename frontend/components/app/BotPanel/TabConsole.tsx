'use client';

import { Maximize2, TerminalSquare } from 'lucide-react';

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
    </div>
  );
}
