'use client';

import { Star } from 'lucide-react';
import Mascot from '@/components/Mascot';
import type { RosterItemType } from './types';

interface RosterItemProps {
  item: RosterItemType;
  active: boolean;
  onSelect: (index: number) => void;
}

export default function RosterItem({ item, active, onSelect }: RosterItemProps) {
  const { bot, index } = item;
  return (
    <button
      onClick={() => onSelect(index)}
      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
        active ? 'bg-white shadow-sm' : 'hover:bg-white/60'
      }`}
    >
      <Mascot
        color={bot.color}
        shape={bot.shape}
        size="md"
        motion="none"
        blinkDelay={`-${index * 1.4}s`}
        className="shrink-0"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-bold text-navy">
          <span className="truncate">{bot.name}</span>
          {bot.isChiefOfStaff && (
            <span title="Chief of staff" className="grid shrink-0 place-items-center">
              <Star className="h-4 w-4 fill-bamber text-bamber" strokeWidth={2} />
            </span>
          )}
        </span>
        <span className="block truncate text-sm text-heroslate">
          {bot.role || 'No role yet'}
        </span>
      </span>
    </button>
  );
}
