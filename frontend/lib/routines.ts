import { generateClient } from 'aws-amplify/data';

// Untyped data client: the generated Schema lives in wayfind-cloud (backend
// package — not importable from a frontend). Runtime model access comes from
// amplify_outputs.json, which this frontend shares with the backend.
// `any` is deliberate — the wrappers below only touch documented fields.
// Reads/writes are owner-scoped server-side (same user pool as cloud).
/* eslint-disable @typescript-eslint/no-explicit-any */
let client: any = null;

function dataClient(): any {
  if (!client) client = generateClient();
  return client;
}

export interface RoutineItem {
  id: string;
  botId?: string;
  name?: string;
  prompt: string;
  kind: 'once' | 'cron';
  cron?: string;
  runAt?: string;
  timezone?: string;
  status: 'active' | 'paused' | 'done';
  nextRunAt?: string;
  lastRunAt?: string;
  lastStatus?: string;
  runCount?: number;
}

/** Routines for one bot (owner-scoped query, client-filtered by botId).
 * Rows for other bots are flagged (never hidden) so the UI can explain
 * instead of showing a bare empty state. */
export async function listBotRoutines(ownerId: string, botId: string): Promise<Array<RoutineItem & { _otherBot?: boolean }>> {
  const { data, errors } = await dataClient().models.Routine.routinesByOwnerId({ ownerId });
  if (errors?.length) throw new Error(errors.map((e: any) => e.message).join('; '));
  return ((data ?? []) as any[])
    .map((r) => ({ ...toItem(r), _otherBot: r.botId !== botId }))
    .sort((a, b) => Number(a._otherBot ?? false) - Number(b._otherBot ?? false) || byNext(a, b));
}

function toItem(r: any): RoutineItem {
  return {
    id: r.id,
    ...(r.botId ? { botId: r.botId } : {}),
    ...(r.name ? { name: r.name } : {}),
    prompt: r.prompt ?? '',
    kind: (r.kind ?? 'once') as 'once' | 'cron',
    ...(r.cron ? { cron: r.cron } : {}),
    ...(r.runAt ? { runAt: r.runAt } : {}),
    ...(r.timezone ? { timezone: r.timezone } : {}),
    status: (r.status ?? 'active') as 'active' | 'paused' | 'done',
    ...(r.nextRunAt ? { nextRunAt: r.nextRunAt } : {}),
    ...(r.lastRunAt ? { lastRunAt: r.lastRunAt } : {}),
    ...(r.lastStatus ? { lastStatus: r.lastStatus } : {}),
    ...(typeof r.runCount === 'number' ? { runCount: r.runCount } : {}),
  };
}

function byNext(a: RoutineItem, b: RoutineItem): number {
  return (a.nextRunAt ?? '').localeCompare(b.nextRunAt ?? '');
}

/** Pause or resume a routine. */
export async function setRoutineStatus(id: string, status: 'active' | 'paused'): Promise<void> {
  const { errors } = await dataClient().models.Routine.update({ id, status });
  if (errors?.length) throw new Error(`routine update failed: ${JSON.stringify(errors)}`);
}

/** Delete a routine. Fired runs already in flight still complete. */
export async function deleteRoutine(id: string): Promise<void> {
  const { errors } = await dataClient().models.Routine.delete({ id });
  if (errors?.length) throw new Error(`routine delete failed: ${JSON.stringify(errors)}`);
}
