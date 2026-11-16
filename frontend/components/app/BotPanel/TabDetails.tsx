'use client';

import type { ReactNode } from 'react';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
      <span className="shrink-0 font-semibold text-heroslate">{label}</span>
      {children}
    </div>
  );
}

export default function TabDetails({ botId, role, description, model }: { botId: string | null; role: string; description?: string | null; model?: string | null }) {
  return (
    <div className="space-y-2 text-sm">
      <Row label="Role">
        <span className="max-w-[10rem] truncate font-semibold text-navy" title={role || undefined}>
          {role || 'No role yet'}
        </span>
      </Row>
      <Row label="Model">
        <span className="max-w-[10rem] truncate font-mono text-xs text-navy" title={model ?? undefined}>
          {model || 'Account default'}
        </span>
      </Row>
      {description && (
        <Row label="Brief">
          <span className="max-w-[10rem] truncate text-navy" title={description}>
            {description}
          </span>
        </Row>
      )}
      <Row label="Bot ID">
        <span className="max-w-[10rem] truncate font-mono text-xs text-navy">{botId ?? 'Not synced yet'}</span>
      </Row>
    </div>
  );
}
