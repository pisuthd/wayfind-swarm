'use client';

import { Search, Plus } from 'lucide-react';
import Mascot from '@/components/Mascot';

interface RosterHeaderProps {
  onToggleSearch: () => void;
  onNew: () => void;
}

export default function RosterHeader({ onToggleSearch, onNew }: RosterHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pb-3 pt-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy">
          <Mascot color="white" size="xs" motion="none" label="Wayfind mascot" />
        </span>
        <span className="font-brico text-lg font-bold text-navy">Wayfind</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onToggleSearch}
          aria-label="Search bots"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-sm hover:bg-slate-50"
        >
          <Search className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <button
          onClick={onNew}
          aria-label="New bot"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-sm hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
