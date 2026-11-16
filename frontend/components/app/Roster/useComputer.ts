'use client';

import { useSyncExternalStore } from 'react';
import { backendConfigured, provisionComputer, requestComputer } from '@/lib/wayfind-api';

export interface ComputerInfo {
  id: string;
  provisionStatus?: string | null;
  endpoint?: string | null;
  microvmId?: string | null;
  region?: string | null;
  imageVersion?: string | null;
}

interface ComputerStore {
  computer: ComputerInfo | null;
  busy: boolean;
  error: string;
}

let snap: ComputerStore = { computer: null, busy: false, error: '' };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function set(partial: Partial<ComputerStore>): void {
  snap = { ...snap, ...partial };
  emit();
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): ComputerStore {
  return snap;
}

/** Shared computer lifecycle: AppShell boots, the thread header shows status. */
export function useComputer() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

type Row = {
  id?: string;
  provisionStatus?: string | null;
  endpoint?: string | null;
  microvmId?: string | null;
  region?: string | null;
  imageVersion?: string | null;
};

function toInfo(row: Row | null | undefined): ComputerInfo | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    provisionStatus: row.provisionStatus ?? null,
    endpoint: row.endpoint ?? null,
    microvmId: row.microvmId ?? null,
    region: row.region ?? null,
    imageVersion: row.imageVersion ?? null,
  };
}

export async function refreshComputer(silent = false): Promise<void> {
  if (!backendConfigured()) return;
  if (!silent) set({ error: '' });
  try {
    const { data } = (await requestComputer()) as { data?: Row };
    set({ computer: toInfo(data) });
  } catch (err) {
    if (!silent) set({ error: err instanceof Error ? err.message : 'Computer status failed' });
  }
}

// Auto-start: once per sign-in, in the background. Provision is
// self-healing, so running is a no-op and dead rows reset + boot.
let ensuredFor: string | null = null;
let lastOwnerId: string | null = null;

export function ensureComputerStart(ownerId: string): void {
  lastOwnerId = ownerId;
  if (!backendConfigured()) return;
  if (ensuredFor === ownerId) return;
  ensuredFor = ownerId;
  void (async () => {
    set({ busy: true, error: '' });
    try {
      try {
        const { data } = (await provisionComputer()) as { data?: Row };
        set({ computer: toInfo(data) });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // 409 suspended = asleep but alive; first traffic wakes it.
        if (/suspended/i.test(msg)) await refreshComputer(true);
        else throw err;
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Auto-start failed' });
    } finally {
      set({ busy: false });
    }
  })();
}

/** Retry after a failed auto-start (clears the once-per-sign-in guard). */
export function retryComputerStart(): void {
  ensuredFor = null;
  if (lastOwnerId) ensureComputerStart(lastOwnerId);
}
