'use client';

import { Trash2 } from 'lucide-react';
import RosterItem from './RosterItem';
import type { RosterItemType } from './types';
import { TEAMS } from '@/lib/teams';

interface RosterListProps {
  items: RosterItemType[];
  cur: number;
  onSelect: (index: number) => void;
  onDeleteTeam?: (teamId: string, teamName: string) => void;
}

/** teamId → display name. `team-<slug>-<ts>` looks up the catalog; null is the default team. */
function teamName(teamId: string | null | undefined): string {
  if (!teamId) return 'My team';
  const slug = teamId.replace(/^team-/, '').replace(/-[a-z0-9]+$/, '');
  return TEAMS.find((t) => t.id === slug)?.name ?? 'Team';
}

export default function RosterList({ items, cur, onSelect, onDeleteTeam }: RosterListProps) {
  const groups = new Map<string | null, RosterItemType[]>();
  for (const item of items) {
    const key = item.bot.teamId ?? null;
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  // Default team first, then the rest in first-seen order.
  const ordered = [...groups.entries()].sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : 0));
  return (
    <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-1" aria-label="Your bots">
      {ordered.map(([teamId, group]) => (
        <section key={teamId ?? 'default'}>
          <div className="flex items-center justify-between px-1 pb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-heroslate/70">
              {teamName(teamId)} · {group.length}
            </p>
            {teamId && onDeleteTeam && (
              <button
                onClick={() => onDeleteTeam(teamId, teamName(teamId))}
                aria-label={`Delete ${teamName(teamId)}`}
                title={`Delete ${teamName(teamId)} (removes its bots)`}
                className="grid h-6 w-6 place-items-center rounded-full text-heroslate/50 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {group.map((item) => (
              <RosterItem
                key={`${item.bot.name}-${item.index}`}
                item={item}
                active={item.index === cur}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}
