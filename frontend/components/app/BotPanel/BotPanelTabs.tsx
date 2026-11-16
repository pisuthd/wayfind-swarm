'use client';

import { useState } from 'react';
import TabDetails from './TabDetails';
import TabConsole from './TabConsole';

const tabs = ['Details', 'Console'] as const;
type Tab = (typeof tabs)[number];

export default function BotPanelTabs({ botId, role, description, model }: { botId: string | null; role: string; description?: string | null; model?: string | null }) {
  const [tab, setTab] = useState<Tab>('Details');

  return (
    <div className="mt-5 flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="Bot panel sections" className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full py-1.5 text-xs font-bold transition ${
              tab === t ? 'bg-navy text-white' : 'text-heroslate hover:text-navy'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-0.5" role="tabpanel">
        {tab === 'Details' && <TabDetails botId={botId} role={role} description={description} model={model} />}
        {tab === 'Console' && <TabConsole />}
      </div>
    </div>
  );
}
