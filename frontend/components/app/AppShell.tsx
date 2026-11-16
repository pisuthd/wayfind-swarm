'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { MascotColor, MascotShape } from '@/components/Mascot';
import Mascot from '@/components/Mascot';
import Roster, { type RosterBot } from './Roster';
import NewBotModal from './Roster/NewBotModal';
import { createBotRow, listBotsByOwner, updateBotRow } from '@/lib/bots';

const validColors: MascotColor[] = ['amber', 'moss', 'lagoon', 'ash', 'blue', 'coral', 'grape'];
const validShapes: MascotShape[] = ['blob', 'circle', 'squircle', 'pebble'];

const lookPool: { color: MascotColor; shape: MascotShape }[] = [
  { color: 'amber', shape: 'blob' },
  { color: 'moss', shape: 'circle' },
  { color: 'lagoon', shape: 'squircle' },
  { color: 'ash', shape: 'pebble' },
  { color: 'blue', shape: 'blob' },
  { color: 'coral', shape: 'circle' },
  { color: 'grape', shape: 'squircle' },
];

type ViewBot = RosterBot & { id: string };

function toViewBot(r: {
  id: string;
  name: string;
  model?: string | null;
  role?: string | null;
  color?: string | null;
  shape?: string | null;
  isChiefOfStaff?: boolean | null;
}): ViewBot {
  return {
    id: r.id,
    name: r.name,
    model: r.model ?? null,
    role: r.role ?? '',
    color: validColors.includes(r.color as MascotColor) ? (r.color as MascotColor) : 'amber',
    shape: validShapes.includes(r.shape as MascotShape) ? (r.shape as MascotShape) : 'blob',
    isChiefOfStaff: r.isChiefOfStaff ?? false,
  };
}

export default function AppShell() {
  const { user } = useAuthenticator((c) => [c.user]);
  const [bots, setBots] = useState<ViewBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState(0);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);

  useEffect(() => {
    const ownerId = user?.userId;
    if (!ownerId) return;
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const rows = await listBotsByOwner(ownerId);
        if (!alive) return;
        setBots(rows.map(toViewBot));
        setCur(0);
      } catch (err) {
        console.error('[AppShell] bots fetch failed:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  const q = query.toLowerCase();
  const items = bots
    .map((bot, index) => ({ bot, index }))
    .filter(({ bot }) => !q || `${bot.name}${bot.role}`.toLowerCase().includes(q));

  const bot = bots[cur] ?? bots[0];

  const createBot = async (name: string, isChief: boolean): Promise<string | null> => {
    const ownerId = user?.userId;
    if (!ownerId) return 'Not signed in. Please sign in again.';
    if (bots.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      return `A bot named "${name}" already exists — pick another name.`;
    }
    const used = new Set(bots.map((b) => `${b.color}/${b.shape}`));
    const free = lookPool.filter((l) => !used.has(`${l.color}/${l.shape}`));
    const pool = free.length > 0 ? free : lookPool;
    const look = pool[Math.floor(Math.random() * pool.length)];
    try {
      // One chief of staff per user: unset the flag on the current chief first.
      if (isChief) {
        const prev = bots.find((b) => b.isChiefOfStaff);
        if (prev) {
          await updateBotRow(prev.id, { isChiefOfStaff: false });
          setBots((botsPrev) => botsPrev.map((b) => (b.id === prev.id ? { ...b, isChiefOfStaff: false } : b)));
        }
      }
      const row = await createBotRow({ ownerId, name, isChiefOfStaff: isChief, ...look });
      setBots((prev) => [toViewBot(row), ...prev]);
      setCur(0);
      setSideOpen(false);
      return null;
    } catch (err) {
      console.error('[AppShell] bot create failed:', err);
      return err instanceof Error ? err.message : 'Create failed. Check your connection and try again.';
    }
  };

  const shell = (main: React.ReactNode) => (
    <div className="flex h-screen overflow-hidden bg-ice font-brico text-navy">
      <Roster
        items={items}
        cur={cur}
        onSelect={(i) => {
          setCur(i);
          setSideOpen(false);
        }}
        query={query}
        onQuery={setQuery}
        showSearch={showSearch}
        onToggleSearch={() => setShowSearch((s) => !s)}
        onNew={() => setBotModalOpen(true)}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
      />
      {main}
      <NewBotModal open={botModalOpen} onClose={() => setBotModalOpen(false)} onCreate={createBot} taken={bots.map((b) => b.name)} />
    </div>
  );

  if (loading) {
    return shell(
      <main className="grid min-w-0 flex-1 place-items-center bg-thread">
        <p className="text-sm text-heroslate">Loading your bots…</p>
      </main>,
    );
  }

  if (!bot) {
    return shell(
      <main className="grid min-w-0 flex-1 place-items-center bg-thread">
        <div className="text-center">
          <p className="text-xl font-bold">No bots yet</p>
          <p className="mt-1 text-sm text-heroslate">Name your first bot to get started.</p>
          <button
            onClick={() => setBotModalOpen(true)}
            className="mt-4 rounded-full bg-cta px-6 py-2.5 text-sm font-bold text-white hover:bg-ctahover"
          >
            Create your first bot
          </button>
        </div>
      </main>,
    );
  }

  return shell(
    <main className="flex min-w-0 flex-1 flex-col bg-thread">
      <header className="relative flex items-center px-4 py-3.5">
        <button
          onClick={() => setSideOpen(true)}
          aria-label="Open bots"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-sm md:hidden"
        >
          <Menu className="h-4 w-4" strokeWidth={2.2} />
        </button>
        <span className="hidden w-40 md:block" />
        <span className="mx-auto flex items-center gap-2.5 rounded-full bg-white py-2 pl-3 pr-5 font-bold text-navy shadow-md shadow-navy/5">
          <Mascot color={bot.color} shape={bot.shape} size="xs" motion="none" />
          <span>{bot.name}</span>
          <span className="hidden text-sm font-medium text-heroslate sm:inline">
            · {bot.role || 'No role yet'}
          </span>
        </span>
        <span className="w-9 md:w-40" />
      </header>

      <div className="grid flex-1 place-items-center px-6">
        <div className="max-w-sm text-center">
          <p className="font-brico text-xl font-bold">Thread coming soon</p>
          <p className="mt-2 text-sm leading-relaxed text-heroslate">
            Chat with {bot.name} and the team thread will live here. Your real bots are listed
            on the left — thread and composer wire up next.
          </p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-2xl border border-navy/10 bg-white p-2 opacity-60">
          <input
            disabled
            placeholder={`Message ${bot.name}… (coming soon)`}
            className="w-full rounded-xl bg-transparent px-4 py-3 text-sm text-navy outline-none placeholder:text-slate-400"
          />
          <span className="shrink-0 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white">
            →
          </span>
        </div>
      </div>
    </main>,
  );
}
