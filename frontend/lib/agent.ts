// Browser client for the computer agent server. SWARM is cloud-only: every
// chat + file call goes through the API relay at <function-url>/computer/proxy
// with the Cognito bearer. The short-lived VM token stays server-side.
'use client';

import { apiBaseUrl, authHeaders } from './wayfind-api';

function agentBase(): string {
  return `${apiBaseUrl()}/computer/proxy`;
}

/** Auth headers: Cognito bearer through the API relay (VM token server-side). */
export async function transportAuthHeaders(): Promise<Record<string, string>> {
  return authHeaders();
}

export interface HistoryMessage {
  role: 'user' | 'assistant' | 'tool';
  text: string;
  at: string;
}

/** Resolve a parked approval. The run resumes and streams on. */
export async function decideApproval(approvalId: string, decision: 'approve' | 'reject' | 'approve-all'): Promise<boolean> {
  const res = await agentFetch(`/approvals/${approvalId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  return res.ok;
}

export interface RosterBot {
  id: string;
  name: string;
  role?: string;
  /** Per-bot skill allowlist (Bot.skillsEnabled). Undefined = all enabled. */
  skills?: string[] | null;
  /** Per-bot MCP allowlist (Bot.mcpEnabled). Undefined = all enabled. */
  mcp?: string[] | null;
}

export async function postTask(
  text: string,
  conversationId?: string,
  system?: string,
  allowedSkills?: string[],
  allowedMcp?: string[],
  opts?: { canManageBots?: boolean; roster?: RosterBot[]; botName?: string; attachments?: string[]; ownerId?: string; idToken?: string },
): Promise<string> {
  // The VM reports metered usage to the backend itself; hand it the API
  // base (the backend can't know its own Function URL).
  let apiUrl: string | undefined;
  try {
    apiUrl = apiBaseUrl();
  } catch {
    apiUrl = undefined;
  }
  const res = await fetch(`${agentBase()}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await transportAuthHeaders()) },
    body: JSON.stringify({
      text,
      conversationId,
      system,
      allowedSkills,
      allowedMcp,
      canManageBots: opts?.canManageBots === true,
      ...(opts?.roster ? { roster: opts.roster } : {}),
      ...(opts?.botName ? { botName: opts.botName } : {}),
      ...(opts?.attachments?.length ? { attachments: opts.attachments } : {}),
      ...(opts?.ownerId ? { ownerId: opts.ownerId } : {}),
      // User JWT for backend-authenticated agent tools (e.g. schedule_task).
      // The VM only forwards it to the backend — never logs or persists it.
      ...(opts?.idToken ? { idToken: opts.idToken } : {}),
      ...(apiUrl ? { apiUrl } : {}),
    }),
  });
  if (!res.ok) throw new Error(`agent /task → ${res.status}`);
  const { runId } = (await res.json()) as { runId: string };
  return runId;
}

export interface StreamHandlers {
  onChunk?: (delta: string) => void;
  onAgent?: (name: string) => void;
  onApproval?: (approval: { approvalId: string; permission?: string; target?: string }) => void;
  onQuestion?: (q: {
    qid: string;
    questions: Array<{ question: string; header?: string; options: Array<{ label: string; description?: string }> }>;
  }) => void;
  onBotRequest?: (r: { bid: string; botName: string; botRole?: string; botDescription?: string }) => void;
}

/** Same as fetch, but against the relay with Cognito auth. */
async function agentFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${agentBase()}${path}`, {
    // Proxy GETs (e.g. /history/:id) must never be served from HTTP cache:
    // a cached 410 kept a dead VM "dead" after recovery (same URL re-fires).
    cache: 'no-store',
    ...init,
    headers: { ...(init?.headers ?? {}), ...(await transportAuthHeaders()) },
  });
  // The relay 410s when the VM is gone (row already reset server-side) or
  // 404s when the row holds no VM at all — broadcast so the computer store
  // flips to reconnecting and auto-reprovisions instead of green-but-dead UI.
  if ((res.status === 410 || res.status === 404) && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wayfind:computer-gone'));
  }
  return res;
}

type RunEvent = { type: string; chunk?: string; agent?: string; output?: string; error?: string } & Record<
  string,
  unknown
>;

/** Shared event dispatch for the run follower. Returns updated output; throws on error events. */
function applyRunEvent(e: RunEvent, handlers: StreamHandlers, output: string): string {
  if (e.type === 'chunk' && typeof e.chunk === 'string') {
    output += e.chunk;
    handlers.onChunk?.(e.chunk);
  } else if (e.type === 'agent' && typeof e.agent === 'string') {
    handlers.onAgent?.(e.agent);
  } else if (e.type === 'approval' && typeof e.approvalId === 'string') {
    handlers.onApproval?.({
      approvalId: e.approvalId as string,
      permission: typeof e.permission === 'string' ? (e.permission as string) : undefined,
      target: typeof e.target === 'string' ? (e.target as string) : undefined,
    });
  } else if (e.type === 'question' && typeof e.qid === 'string' && Array.isArray(e.questions)) {
    handlers.onQuestion?.({
      qid: e.qid as string,
      questions: e.questions as {
        question: string;
        header?: string;
        options: Array<{ label: string; description?: string }>;
      }[],
    });
  } else if (e.type === 'bot_request' && typeof e.bid === 'string' && typeof e.botName === 'string') {
    handlers.onBotRequest?.({
      bid: e.bid as string,
      botName: e.botName as string,
      botRole: typeof e.botRole === 'string' ? (e.botRole as string) : undefined,
      botDescription: typeof e.botDescription === 'string' ? (e.botDescription as string) : undefined,
    });
  } else if (e.type === 'done') {
    if (typeof e.output === 'string') output = e.output;
  } else if (e.type === 'error') {
    throw new Error(typeof e.error === 'string' ? e.error : 'agent run failed');
  }
  return output;
}

export interface RunEventsPage {
  events: RunEvent[];
  nextCursor: number;
  done: boolean;
}

/** One page of run events (pollable twin of the SSE stream). */
export async function getRunEvents(runId: string, cursor: number): Promise<RunEventsPage> {
  const res = await agentFetch(`/runs/${runId}/events?cursor=${cursor}`);
  if (!res.ok) throw new Error(`agent /runs/events → ${res.status}`);
  return (await res.json()) as RunEventsPage;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Progressive run follower for the buffered cloud relay: polls the events
 * endpoint ~1/s and dispatches the same handlers a stream would, so chunks,
 * approvals, questions and bot requests all surface mid-run. Tolerates up to
 * 3 consecutive fetch failures before giving up. */
export async function streamRunProgressive(
  runId: string,
  handlers: StreamHandlers,
  opts?: { intervalMs?: number; timeoutMs?: number },
): Promise<string> {
  let cursor = 0;
  let output = '';
  let failures = 0;
  const interval = opts?.intervalMs ?? 1000;
  const deadline = Date.now() + (opts?.timeoutMs ?? 600_000);
  for (;;) {
    if (Date.now() > deadline) throw new Error('agent run timed out');
    let page: RunEventsPage;
    try {
      page = await getRunEvents(runId, cursor);
      failures = 0;
    } catch (err) {
      failures += 1;
      if (failures >= 3) throw err;
      await sleep(interval);
      continue;
    }
    for (const e of page.events ?? []) {
      output = applyRunEvent(e, handlers, output);
      if (e.type === 'done') return output;
    }
    cursor = typeof page.nextCursor === 'number' ? page.nextCursor : cursor + (page.events?.length ?? 0);
    if (page.done) return output;
    await sleep(interval);
  }
}

/** Answer a parked question. The run continues with your answers. */
export async function answerQuestion(qid: string, answers: string[][]): Promise<boolean> {
  const res = await agentFetch(`/questions/${qid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  return res.ok;
}

interface PendingApproval {
  id: string;
  runId: string;
  permission: string;
  target: string;
}

interface PendingQuestion {
  id: string;
  runId: string;
  questions: Array<{
    question: string;
    header?: string;
    options: Array<{ label: string; description?: string }>;
  }>;
}

interface PendingBotRequest {
  id: string;
  runId: string;
  request: { name: string; role?: string; description?: string };
}

/** Poll the pending-interaction lists for one run and feed the same handlers
 * the stream uses, so a parked run (approval / question / bot request) can't
 * deadlock the UI into a forever spinner. Filtered to this runId; harmless
 * when empty. */
export async function pollPending(
  runId: string,
  handlers: Pick<StreamHandlers, 'onApproval' | 'onQuestion' | 'onBotRequest'>,
): Promise<void> {
  const [a, q, b] = await Promise.all([
    agentFetch('/approvals')
      .then((r) => (r.ok ? r.json() : { approvals: [] }))
      .catch(() => ({ approvals: [] })),
    agentFetch('/questions')
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .catch(() => ({ questions: [] })),
    agentFetch('/bot-requests')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .catch(() => ({ requests: [] })),
  ]);
  for (const p of ((a as { approvals?: PendingApproval[] }).approvals ?? []).filter((p) => p?.runId === runId)) {
    handlers.onApproval?.({ approvalId: p.id, permission: p.permission, target: p.target });
  }
  for (const p of ((q as { questions?: PendingQuestion[] }).questions ?? []).filter((p) => p?.runId === runId)) {
    handlers.onQuestion?.({ qid: p.id, questions: p.questions });
  }
  for (const p of ((b as { requests?: PendingBotRequest[] }).requests ?? []).filter((p) => p?.runId === runId)) {
    handlers.onBotRequest?.({
      bid: p.id,
      botName: p.request.name,
      botRole: p.request.role,
      botDescription: p.request.description,
    });
  }
}

/** Resolve a parked bot-creation request. Confirm carries the created bot id (or an error); cancel declines. */
export async function answerBotRequest(
  bid: string,
  result: { decision: 'confirm' | 'cancel'; botId?: string; error?: string },
): Promise<boolean> {
  const res = await agentFetch(`/bot-requests/${bid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  return res.ok;
}

/** Compress a first message into a short role label. Returns '' on failure (caller keeps role empty). */
export async function summarizeRole(text: string, ownerId?: string): Promise<string> {
  try {
    const res = await agentFetch(`/summarize-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...(ownerId ? { ownerId } : {}) }),
    });
    if (!res.ok) return '';
    const { role } = (await res.json()) as { role?: string };
    return typeof role === 'string' ? role.trim().slice(0, 80) : '';
  } catch {
    return '';
  }
}

/** Transcript for one bot (each Bot id is its conversation). */
export async function getHistory(conversationId: string): Promise<HistoryMessage[]> {
  const res = await agentFetch(`/history/${conversationId}`);
  if (!res.ok) throw new Error(`agent /history → ${res.status}`);
  const { messages } = (await res.json()) as { messages: HistoryMessage[] };
  return messages;
}

// ---- Files ----

export interface FileEntry {
  name: string;
  dir: boolean;
  size: number;
  mtime: number;
}

/** Shallow workspace listing for the upload folder picker. */
export async function listFiles(path = ''): Promise<{ path: string; entries: FileEntry[] }> {
  const res = await agentFetch(`/files?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`agent /files → ${res.status}`);
  return res.json() as Promise<{ path: string; entries: FileEntry[] }>;
}

/** Upload a file (base64) into the shared workspace. Throws with server message. */
export async function uploadFile(path: string, contentBase64: string): Promise<{ size: number }> {
  const res = await agentFetch(`/files/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, contentBase64 }),
  });
  const body = (await res.json().catch(() => ({}))) as { size?: number; error?: string };
  if (!res.ok) throw new Error(body.error ?? `agent /files/upload → ${res.status}`);
  return { size: body.size ?? 0 };
}

/** Inline view URL for a workspace image (chat thumbnails and messages). */
export function viewFileUrl(path: string): string {
  return `${agentBase()}/files/view?path=${encodeURIComponent(path)}`;
}

/** Direct download URL for a workspace file. */
export function downloadFileUrl(path: string): string {
  return `${agentBase()}/files/download?path=${encodeURIComponent(path)}`;
}

/** Download a workspace file. The relay needs the Cognito bearer, which <a>
 * cannot send — so fetch as blob and trigger the download programmatically. */
export async function downloadViaApi(path: string): Promise<void> {
  const res = await agentFetch(`/files/download?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`agent /files/download → ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

// ---- Permissions (global guard rules) ----

export interface PermissionRule {
  permission: string;
  pattern: string;
  action: 'allow' | 'ask' | 'deny';
}

export async function getPermissions(): Promise<{ rules: PermissionRule[]; canUndo: boolean }> {
  const res = await agentFetch(`/permissions`);
  if (!res.ok) throw new Error(`agent /permissions → ${res.status}`);
  return (await res.json()) as { rules: PermissionRule[]; canUndo: boolean };
}

export async function setPermissions(rules: PermissionRule[]): Promise<PermissionRule[]> {
  const res = await agentFetch(`/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules }),
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? `agent /permissions → ${res.status}`);
  }
  const { rules: saved } = (await res.json()) as { rules: PermissionRule[] };
  return saved;
}

/** Restore permissions to before the last save. Returns null when nothing to undo. */
export async function undoPermissions(): Promise<{ rules: PermissionRule[]; canUndo: boolean } | null> {
  const res = await agentFetch(`/permissions/undo`, { method: 'POST' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`agent /permissions/undo → ${res.status}`);
  return (await res.json()) as { rules: PermissionRule[]; canUndo: boolean };
}

// ---- Skills + MCP (settings tabs + per-bot pickers) ----

export interface InstalledSkill {
  name: string;
  description: string;
  source: string;
  files: number;
}

/** Installed skill catalog for the per-bot picker. */
export async function getSkills(): Promise<InstalledSkill[]> {
  const res = await agentFetch(`/skills`);
  if (!res.ok) throw new Error(`agent /skills → ${res.status}`);
  return ((await res.json()) as { skills: InstalledSkill[] }).skills;
}

export interface McpServer {
  name: string;
  type: 'stdio' | 'remote';
  isActive: boolean;
  /** Env/header key names only — values never leave the computer. */
  configKeys: string[];
  disabledTools: string[];
  /** Live state: unknown = never connected since boot. */
  status: 'connected' | 'error' | 'unknown';
  tools: number;
  lastError?: string;
}

/** Remove an installed skill. Returns false when unknown. */
export async function removeSkill(name: string): Promise<boolean> {
  const res = await agentFetch(`/skills/${encodeURIComponent(name)}`, { method: 'DELETE' });
  return res.ok;
}

export interface McpServerInput {
  command?: string[];
  /** Claude-format split, e.g. command:"npx" + args:["-y","pkg"]. */
  args?: string[];
  /** Alias for environment (Claude-format configs). */
  env?: Record<string, string>;
  environment?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
  disabledTools?: string[];
}

/** Global MCP registry for the settings tab + per-bot picker. */
export async function getMcpServers(): Promise<McpServer[]> {
  const res = await agentFetch(`/mcp`);
  if (!res.ok) throw new Error(`agent /mcp → ${res.status}`);
  return ((await res.json()) as { servers: McpServer[] }).servers;
}

/** Add a server. Throws with the validation message on conflict. */
export async function saveMcpServer(name: string, cfg: McpServerInput): Promise<McpServer[]> {
  const res = await agentFetch(`/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ...cfg }),
  });
  const body = (await res.json()) as { servers?: McpServer[]; error?: string };
  if (!res.ok) throw new Error(body.error ?? `agent /mcp → ${res.status}`);
  return body.servers ?? [];
}

/** Partial update: toggle active, edit env/headers, disable tools. */
export async function patchMcpServer(name: string, cfg: McpServerInput): Promise<McpServer[]> {
  const res = await agentFetch(`/mcp/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  });
  const body = (await res.json()) as { servers?: McpServer[]; error?: string };
  if (!res.ok) throw new Error(body.error ?? `agent /mcp → ${res.status}`);
  return body.servers ?? [];
}

/** Remove a server. Returns false when unknown. */
export async function removeMcpServer(name: string): Promise<boolean> {
  const res = await agentFetch(`/mcp/${encodeURIComponent(name)}`, { method: 'DELETE' });
  return res.ok;
}

/** Force-reconnect a server. Throws with the server's error message on failure. */
export async function restartMcpServer(name: string): Promise<McpServer[]> {
  const res = await agentFetch(`/mcp/${encodeURIComponent(name)}/restart`, { method: 'POST' });
  const body = (await res.json()) as { servers?: McpServer[]; error?: string };
  if (!res.ok) throw new Error(body.error ?? `agent /mcp → ${res.status}`);
  return body.servers ?? [];
}
