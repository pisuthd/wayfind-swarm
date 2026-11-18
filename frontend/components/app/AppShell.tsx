'use client';

import { useEffect, useState } from 'react';
import { Menu, PanelRight } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { MascotColor, MascotShape } from '@/components/Mascot';
import Mascot from '@/components/Mascot';
import Roster, { type RosterBot } from './Roster';
import NewBotModal from './Roster/NewBotModal';
import TeamPickerModal from './Roster/TeamPickerModal';
import { importTeam, type TeamSpec } from '@/lib/teams';
import BotPanel, { type BotEdits } from './BotPanel';
import Thread from './Thread';
import Composer from './Composer';
import SkillsPickerModal from './SkillsPickerModal';
import McpPickerModal from './McpPickerModal';
import { createBotRow, deleteBotRow, listBotsByOwner, updateBotRow } from '@/lib/bots';
import { ensureComputerStart, refreshComputer, retryComputerStart, useComputer } from './Roster/useComputer';
import {
  answerBotRequest,
  answerQuestion,
  clearContext,
  compactContext,
  decideApproval,
  getContextStats,
  getHistory,
  pollPending,
  postTask,
  streamRunProgressive,
  summarizeRole,
  type ContextStats,
} from '@/lib/agent';
import { fmtCtxTokens } from './Composer';
import { friendlyModelName } from '@/lib/models';
import { FOLLOW_UP_NO, isImageProgress, type Msg } from '@/lib/chat';

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

// Bots already greeted this session (module-level: survives remounts and
// StrictMode double-effects so the hello run fires exactly once per bot).
const helloAttempted = new Set<string>();

/** Model label for tool rows ("Muse Spark Open" or "account default"). */
function modelLabel(m: string | null | undefined): string {
  if (!m) return 'account default';
  return friendlyModelName(m);
}

type ViewBot = RosterBot & {
  id: string;
  skillsEnabled: string[] | null;
  mcpEnabled: string[] | null;
  busy: boolean;
  msgs: Msg[];
};

function toViewBot(r: {
  id: string;
  teamId?: string | null;
  name: string;
  model?: string | null;
  description?: string | null;
  role?: string | null;
  color?: string | null;
  shape?: string | null;
  isChiefOfStaff?: boolean | null;
  skillsEnabled?: string[] | null;
  mcpEnabled?: string[] | null;
}): ViewBot {
  return {
    id: r.id,
    teamId: r.teamId ?? null,
    name: r.name,
    model: r.model ?? null,
    description: r.description ?? null,
    role: r.role ?? '',
    color: validColors.includes(r.color as MascotColor) ? (r.color as MascotColor) : 'amber',
    shape: validShapes.includes(r.shape as MascotShape) ? (r.shape as MascotShape) : 'blob',
    isChiefOfStaff: r.isChiefOfStaff ?? false,
    skillsEnabled: r.skillsEnabled ?? null,
    mcpEnabled: r.mcpEnabled ?? null,
    busy: false,
    msgs: [],
  };
}

export default function AppShell() {
  const { user } = useAuthenticator((c) => [c.user]);
  const { computer, busy: computerBusy, error: computerError } = useComputer();
  const [bots, setBots] = useState<ViewBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [cur, setCur] = useState(0);
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [ctxById, setCtxById] = useState<Record<string, ContextStats>>({});
  const [compacting, setCompacting] = useState(false);

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

  useEffect(() => {
    if (!user?.userId) return;
    ensureComputerStart(user.userId);
    const t = setInterval(() => {
      void refreshComputer(true);
    }, 10_000);
    return () => clearInterval(t);
  }, [user?.userId]);

  // The VM is gone mid-chat (relay 410/404): flip to reconnecting and
  // auto-reprovision instead of green-but-dead UI.
  useEffect(() => {
    const onGone = () => {
      void refreshComputer(true);
    };
    window.addEventListener('wayfind:computer-gone', onGone);
    return () => window.removeEventListener('wayfind:computer-gone', onGone);
  }, []);

  const computerStatus = computer?.provisionStatus ?? 'unknown';
  const computerReady = computerStatus === 'running' || computerStatus === 'suspended';
  const bootHint = computerError
    ? `Couldn't start your computer — ${computerError}`
    : computerBusy
      ? 'Booting your computer…'
      : 'Setting up your computer…';

  const bot = bots[cur] ?? bots[0];

  // Hydrate per-bot history from the agent server (each Bot id is its
  // conversation). Skipped while the computer isn't ready: history lives on
  // the VM, so a missing VM would just fail — the effect re-runs when ready.
  useEffect(() => {
    if (!computerReady) return;
    const b = bots[cur];
    if (!b?.id || b.msgs.length > 0) return;
    let alive = true;
    void (async () => {
      try {
        const history = await getHistory(b.id);
        if (!alive) return;
        if (history.length === 0) {
          greetBot(b);
          refreshCtx(b.id, b.model ?? undefined);
          return;
        }
        patchBot(cur, (prev) =>
          prev.msgs.length > 0
            ? prev
            : {
                ...prev,
                // Drop stale image-progress rows — the skeleton only
                // lives while a run is in flight.
                msgs: history
                  .filter((m) => !(m.role === 'tool' && isImageProgress(m.text)))
                  .map((m) =>
                    m.role === 'assistant'
                      ? { t: 'b' as const, x: m.text }
                      : m.role === 'tool'
                        ? { t: 'tool' as const, x: m.text }
                        : { t: 'u' as const, x: m.text },
                  ),
              },
        );
          refreshCtx(b.id, b.model ?? undefined);
        } catch (err) {
        // 410 = VM gone mid-recycle — the computer-gone broadcast already
        // scheduled recovery, not worth a console error per bot.
        const msg = err instanceof Error ? err.message : String(err);
        if (!/→ 410/.test(msg)) console.error('[AppShell] history fetch failed:', err);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, bots[cur]?.id, bots[cur]?.msgs.length, computerReady]);

  const patchBot = (index: number, fn: (b: ViewBot) => ViewBot) =>
    setBots((prev) => prev.map((b, i) => (i === index ? fn(b) : b)));

  // Index-stable patching for in-flight runs: roster inserts (chief-created
  // bots prepend) shift indices mid-stream, so everything after the
  // synchronous optimistic update patches by bot id.
  const patchBotById = (id: string, fn: (b: ViewBot) => ViewBot) =>
    setBots((prev) => prev.map((b) => (b.id === id ? fn(b) : b)));

  // Refresh the context pill for a bot (best-effort — the pill hides on failure).
  const refreshCtx = (botId: string, model?: string | null) => {
    if (!computerReady) return;
    void getContextStats(botId, model ?? undefined)
      .then((s) => setCtxById((prev) => ({ ...prev, [botId]: s })))
      .catch(() => {});
  };

  const send = (attachments: string[] = []) => sendText(draft, attachments);

  // Compact this bot's context now (button or /compact command). No model
  // run is spent — the endpoint summarizes server-side.
  const compactNow = (includeUserBubble: boolean) => {
    if (!bot || bot.busy || compacting) return;
    const targetIndex = cur;
    const targetId = bot.id;
    const targetModel = bot.model ?? undefined;
    setDraft('');
    setCompacting(true);
    patchBot(targetIndex, (b) => ({
      ...b,
      busy: true,
      msgs: includeUserBubble
        ? [...b.msgs, { t: 'u', x: '/compact' }, { t: 'typing', since: Date.now() }]
        : [...b.msgs, { t: 'typing', since: Date.now() }],
    }));
    const patchTarget = (fn: (b: ViewBot) => ViewBot) => patchBotById(targetId, fn);
    void (async () => {
      try {
        const out = await compactContext(targetId, targetModel);
        patchTarget((b) => ({
          ...b,
          busy: false,
          msgs: [
            ...b.msgs.filter((m) => m.t !== 'typing'),
            {
              t: 'tool',
              x: out.compacted
                ? `Context compacted — ${out.note} (${fmtCtxTokens(out.tokens)} · ${out.pct}%)`
                : `Context kept — ${out.note} (${fmtCtxTokens(out.tokens)} · ${out.pct}%)`,
            },
          ],
        }));
        setCtxById((prev) => ({ ...prev, [targetId]: out }));
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error('[AppShell] compact failed:', detail);
        patchTarget((b) => ({
          ...b,
          busy: false,
          msgs: [...b.msgs.filter((m) => m.t !== 'typing'), { t: 'b', x: `Compact failed: ${detail.slice(0, 200)}` }],
        }));
      } finally {
        setCompacting(false);
      }
    })();
  };

  const sendText = (raw: string, attachments: string[] = [], opts?: { hello?: boolean }) => {
    const v = raw.trim();
    if ((!v && attachments.length === 0) || !bot || bot.busy) return;
    // Slash command: compact without spending a model run.
    if (v.toLowerCase() === '/compact' && attachments.length === 0 && !opts?.hello) {
      compactNow(true);
      return;
    }
    const targetIndex = cur;
    const targetId = bot.id;
    const targetName = bot.name;
    const targetRole = bot.role;
    const targetIsChief = bot.isChiefOfStaff ?? false;
    const targetTeamId = bot.teamId ?? null;
    const targetSkills = bot.skillsEnabled;
    const targetMcp = bot.mcpEnabled;
    const targetModel = bot.model ?? undefined;
    setDraft('');
    // Hello runs are bot-initiated: no user bubble, just the typing row.
    // Failures stay silent so the thread simply starts empty.
    const hello = opts?.hello === true;
    patchBot(targetIndex, (b) => ({
      ...b,
      busy: true,
      msgs: hello
        ? [...b.msgs, { t: 'typing', since: Date.now() }]
        : [...b.msgs, { t: 'u', x: v || '(attached files)', ...(attachments.length > 0 ? { files: attachments } : {}) }, { t: 'typing', since: Date.now() }],
    }));
    // Stable identity for the whole run: roster inserts shift indices, so
    // every patch below keys on the bot id. Falls back to the captured
    // index only when the bot has no id yet (local-only, pre-save).
    const patchTarget = (fn: (b: ViewBot) => ViewBot) =>
      targetId ? patchBotById(targetId, fn) : patchBot(targetIndex, fn);
    void (async () => {
      const finish = (fn: (b: ViewBot) => ViewBot) => patchTarget((b) => ({ ...fn(b), busy: false }));
      try {
        // Scoped team: leads see every bot (cross-team reach, incl.
        // lead-to-lead); members see their own team only. The same scope
        // feeds the roster, the directory below, and mention autocomplete.
        const scopeBots = targetIsChief ? bots : bots.filter((b) => (b.teamId ?? null) === targetTeamId);
        const teammates = scopeBots.filter((b) => b.id && b.id !== targetId);
        const teamDir =
          teammates.length > 0
            ? `\nYour team: ${teammates
                .map((b) => `${b.name}${b.role ? ` (${b.role})` : ''}${b.isChiefOfStaff ? ', lead' : ''}`)
                .join('; ')}. Mention a teammate with @Name to consult them.`
            : '';
        const system = targetId
          ? targetRole
            ? `You are "${targetName}". Role: ${targetRole}.${teamDir}`
            : `You are "${targetName}". Your role is not defined yet.${teamDir}`
          : undefined;
        // User JWT for backend-authenticated agent tools (e.g.
        // schedule_task). Forwarded only — never logged or persisted.
        const idToken = await fetchAuthSession()
          .then((s) => s.tokens?.idToken?.toString())
          .catch(() => undefined);
        const runId = await postTask(v, targetId ?? undefined, system, targetSkills ?? undefined, targetMcp ?? undefined, {
          canManageBots: targetIsChief,
          ...(targetModel ? { model: targetModel } : {}),
          // Lead: every bot (cross-team). Member: own team only.
          // No roster at all when the bot is alone — message_bot stays hidden.
          roster: (() => {
            const entries = scopeBots
              .filter((b) => b.id)
              .map((b) => ({ id: b.id as string, name: b.name, role: b.role, skills: b.skillsEnabled, mcp: b.mcpEnabled }));
            return entries.length > 0 ? entries : undefined;
          })(),
          botName: targetName,
          ...(attachments.length > 0 ? { attachments } : {}),
          ...(user?.userId ? { ownerId: user.userId } : {}),
          ...(idToken ? { idToken } : {}),
        });
        // One handler set feeds both the progressive follower and the
        // pending-poll below, so a parked run surfaces its card even when
        // buffered. Each card is id-keyed: poll + follower doubles are
        // dropped, not duplicated.
        const onChunk = (delta: string) =>
          patchTarget((b) => {
            const msgs = b.msgs.filter((m) => m.t !== 'typing');
            const last = msgs[msgs.length - 1];
            if (last && last.t === 'b') msgs[msgs.length - 1] = { t: 'b', x: last.x + delta };
            else msgs.push({ t: 'b', x: delta });
            return { ...b, msgs };
          });
        const onAgent = (name: string) =>
          patchTarget((b) => {
            const msgs = b.msgs.filter((m) => m.t !== 'typing');
            const row: Msg = { t: 'tool', x: `${name}` };
            const last = msgs[msgs.length - 1];
            if (last && last.t === 'tool') msgs[msgs.length - 1] = row;
            else msgs.push(row);
            return { ...b, msgs };
          });
        const onQuestion = (q: { qid: string; questions: { question: string; header?: string; options: { label: string; description?: string }[] }[] }) =>
          patchTarget((b) => {
            if (b.msgs.some((m) => m.t === 'q' && m.qid === q.qid)) return b;
            return {
              ...b,
              msgs: [
                ...b.msgs.filter((m) => m.t !== 'typing'),
                { t: 'q', qid: q.qid, questions: q.questions },
              ],
            };
          });
        const onApproval = (a: { approvalId: string; permission?: string; target?: string }) =>
          patchTarget((b) => {
            if (b.msgs.some((m) => m.t === 'ask' && m.approvalId === a.approvalId)) return b;
            return {
              ...b,
              msgs: [
                ...b.msgs.filter((m) => m.t !== 'typing'),
                {
                  t: 'ask',
                  title: 'Approval needed',
                  x: `${a.permission ?? 'tool'}: ${a.target ?? ''}`,
                  ok: 'Approve',
                  after: 'Approved — continuing.',
                  approvalId: a.approvalId,
                  permission: a.permission,
                },
              ],
            };
          });
        const onBotRequest = (r: {
          bid: string;
          kind?: 'create' | 'update';
          botName: string;
          botTarget?: string;
          botRole?: string;
          botDescription?: string;
          botNewName?: string;
        }) =>
          patchTarget((b) => {
            if (b.msgs.some((m) => m.t === 'botreq' && m.bid === r.bid)) return b;
            return {
              ...b,
              msgs: [
                ...b.msgs.filter((m) => m.t !== 'typing'),
                {
                  t: 'botreq',
                  bid: r.bid,
                  kind: r.kind ?? 'create',
                  target: r.botTarget ?? (r.kind === 'update' ? r.botName : undefined),
                  name: r.botName,
                  role: r.botRole,
                  description: r.botDescription,
                  newName: r.botNewName,
                },
              ],
            };
          });
        const pollTimer = setInterval(() => void pollPending(runId, { onApproval, onQuestion, onBotRequest }), 2500);
        let finalOutput = '';
        try {
          finalOutput = await streamRunProgressive(runId, { onChunk, onAgent, onQuestion, onApproval, onBotRequest });
        } finally {
          clearInterval(pollTimer);
        }
        // Run finished — the returned output is authoritative: the server
        // appends anything the streamed chunks missed (unrendered generated
        // images, Sources block). Sync the last bot message to it, then drop
        // any image-progress skeleton rows.
        patchTarget((b) => {
          const msgs = b.msgs.filter((m) => !(m.t === 'tool' && isImageProgress(m.x)));
          if (finalOutput) {
            const idx = msgs.map((m) => m.t).lastIndexOf('b');
            if (idx >= 0 && msgs[idx].t === 'b' && msgs[idx].x !== finalOutput) {
              msgs[idx] = { t: 'b', x: finalOutput };
            } else if (idx < 0) {
              msgs.push({ t: 'b', x: finalOutput });
            }
          }
          return { ...b, busy: false, msgs };
        });
        refreshCtx(targetId, targetModel);
        // First chat defines the role (skipped for hello runs — the intro
        // text must never be summarized into a role): AI compresses the
        // user's job description into a short label and saves it (manual
        // edits win — this only fires while the role is still empty, never
        // for the chief).
        if (targetId && !targetRole && !targetIsChief && !hello) {
          void (async () => {
            try {
              const role = await summarizeRole(v, user?.userId);
              if (!role) return;
              await updateBotRow(targetId, { role });
              patchTarget((b) => (b.role ? b : { ...b, role }));
            } catch (err) {
              console.error('[AppShell] role summarize failed:', err);
            }
          })();
        }
      } catch (err) {
        // Surface the real failure instead of a generic line — the user can
        // paste it straight back for debug. Hello runs stay silent: a failed
        // intro leaves a clean thread.
        const detail = err instanceof Error ? err.message : String(err);
        console.error('[AppShell] agent send failed:', detail);
        finish((b) => ({
          ...b,
          msgs: hello
            ? [...b.msgs.filter((m) => m.t !== 'typing')]
            : [...b.msgs.filter((m) => m.t !== 'typing'), { t: 'b', x: `That run failed: ${detail.slice(0, 300)}` }],
        }));
        refreshCtx(targetId, targetModel);
      }
    })();
  };

  // Bot-initiated hello: one model run per bot, fired when its thread is
  // known-empty and the computer is ready. Exactly-once via the module set.
  const greetBot = (b: ViewBot) => {
    if (!b.id || helloAttempted.has(b.id) || !computerReady) return;
    helloAttempted.add(b.id);
    sendText(
      b.role
        ? 'Introduce yourself briefly in character and ask for the first task.'
        : 'Introduce yourself briefly and ask the user to define your role: what to do, what never to do, and what to remember.',
      [],
      { hello: true },
    );
  };

  const approve = (msgIndex: number, decision: 'approve' | 'reject' | 'approve-all') => {
    const ok = decision !== 'reject';
    patchBot(cur, (b) => {
      const target = b.msgs[msgIndex];
      if (!target || target.t !== 'ask' || target.done !== undefined) return b;
      const follow: Msg = {
        t: 'b',
        x: decision === 'approve-all' ? 'Shell allowed for the rest of this run.' : ok ? target.after : FOLLOW_UP_NO,
      };
      const msgs = b.msgs.map((m, j) =>
        j === msgIndex && m.t === 'ask' ? { ...m, done: ok ? ('ok' as const) : ('no' as const) } : m,
      );
      return { ...b, msgs: [...msgs, follow] };
    });
    // Server-backed approval: tell the parked run to resume (or stop).
    const target = bot?.msgs[msgIndex];
    if (target && target.t === 'ask' && target.approvalId) {
      const approvalId = target.approvalId;
      void decideApproval(approvalId, decision).catch((err) =>
        console.error('[AppShell] approval decision failed:', err),
      );
    }
  };

  const answer = (msgIndex: number, answers: string[][]) => {
    patchBot(cur, (b) => {
      const target = b.msgs[msgIndex];
      if (!target || target.t !== 'q' || target.done) return b;
      return { ...b, msgs: b.msgs.map((m, j) => (j === msgIndex && m.t === 'q' ? { ...m, done: true as const } : m)) };
    });
    const target = bot?.msgs[msgIndex];
    if (target && target.t === 'q') {
      const qid = target.qid;
      void answerQuestion(qid, answers).catch((err) => console.error('[AppShell] answer failed:', err));
    }
  };

  // Core bot insert (no navigation). Returns the created id or an error message.
  const insertBot = async (
    name: string,
    isChief: boolean,
    role?: string,
    description?: string,
    teamId?: string | null,
  ): Promise<{ botId: string | null; error: string | null }> => {
    const ownerId = user?.userId;
    if (!ownerId) return { botId: null, error: 'Not signed in. Please sign in again.' };
    const used = new Set(bots.map((b) => `${b.color}/${b.shape}`));
    const free = lookPool.filter((l) => !used.has(`${l.color}/${l.shape}`));
    const pool = free.length > 0 ? free : lookPool;
    const look = pool[Math.floor(Math.random() * pool.length)];
    try {
      // One chief of staff per team: unset the flag on the current
      // same-team chief first.
      if (isChief) {
        const prev = bots.find((b) => b.isChiefOfStaff && (b.teamId ?? null) === (teamId ?? null));
        if (prev) {
          await updateBotRow(prev.id, { isChiefOfStaff: false });
          setBots((botsPrev) => botsPrev.map((b) => (b.id === prev.id ? { ...b, isChiefOfStaff: false } : b)));
        }
      }
      const row = await createBotRow({
        ownerId,
        ...(teamId ? { teamId } : {}),
        name,
        ...(isChief ? { isChiefOfStaff: true } : {}),
        ...(!isChief && role ? { role } : {}),
        ...(!isChief && description ? { description } : {}),
        ...look,
      });
      setBots((prev) => [toViewBot(row), ...prev]);
      return { botId: row.id, error: null };
    } catch (err) {
      console.error('[AppShell] bot create failed:', err);
      return { botId: null, error: err instanceof Error ? err.message : 'Create failed. Check your connection and try again.' };
    }
  };

  // Lead-proposed bot change: confirm card → apply without leaving the
  // thread. Creates join the lead's team; updates are same-team only.
  // Name uniqueness is enforced here so the model retries with another name.
  const confirmBotRequest = (msgIndex: number, ok: boolean) => {
    const chief = bots[cur];
    const target = chief?.msgs[msgIndex];
    if (!chief?.id || !target || target.t !== 'botreq' || target.done !== undefined) return;
    const chiefId = chief.id;
    const bid = target.bid;
    const kind = target.kind ?? 'create';
    // Locate the chief by id at patch time — insertBot prepends, shifting indices.
    const patchChief = (fn: (b: ViewBot) => ViewBot) =>
      setBots((prev) => {
        const i = prev.findIndex((b) => b.id === chiefId);
        return i < 0 ? prev : prev.map((b, j) => (j === i ? fn(b) : b));
      });
    if (!ok) {
      patchChief((b) => ({
        ...b,
        msgs: b.msgs.map((m, j) => (j === msgIndex && m.t === 'botreq' ? { ...m, done: 'cancelled' as const } : m)),
      }));
      void answerBotRequest(bid, { decision: 'cancel' }).catch((err) =>
        console.error('[AppShell] bot request cancel failed:', err),
      );
      return;
    }
    if (kind === 'update') {
      void (async () => {
        const cancel = (error: string) => {
          patchChief((b) => ({
            ...b,
            msgs: b.msgs.map((m, j) => (j === msgIndex && m.t === 'botreq' ? { ...m, done: 'cancelled' as const } : m)),
          }));
          void answerBotRequest(bid, { decision: 'cancel', error }).catch((err) =>
            console.error('[AppShell] bot request resolve failed:', err),
          );
        };
        const member = bots.find((b) => b.id && b.name.toLowerCase() === (target.target ?? target.name).toLowerCase());
        if (!member?.id) return cancel(`No bot named "${target.target ?? target.name}" — it may have been deleted.`);
        if ((member.teamId ?? null) !== (chief.teamId ?? null)) {
          return cancel(`"${member.name}" is on another team — leads can only edit their own members.`);
        }
        if (target.newName && bots.some((b) => b.id !== member.id && b.name.toLowerCase() === target.newName!.toLowerCase())) {
          return cancel(`A bot named "${target.newName}" already exists — pick another name.`);
        }
        const patch: { name?: string; role?: string; description?: string } = {
          ...(target.newName ? { name: target.newName } : {}),
          ...(target.role ? { role: target.role } : {}),
          ...(target.description ? { description: target.description } : {}),
        };
        try {
          await updateBotRow(member.id, patch);
        } catch (err) {
          return cancel(err instanceof Error ? err.message : 'Update failed.');
        }
        const mid = member.id;
        setBots((prev) => prev.map((b) => (b.id === mid ? { ...b, ...patch } : b)));
        patchChief((b) => ({
          ...b,
          msgs: b.msgs.map((m, j) => (j === msgIndex && m.t === 'botreq' ? { ...m, done: 'updated' as const } : m)),
        }));
        void answerBotRequest(bid, { decision: 'confirm' }).catch((err) =>
          console.error('[AppShell] bot request confirm failed:', err),
        );
      })();
      return;
    }
    const nameTaken = bots.some((b) => b.name.toLowerCase() === target.name.toLowerCase());
    if (nameTaken) {
      const error = `A bot named "${target.name}" already exists — pick another name.`;
      patchChief((b) => ({
        ...b,
        msgs: b.msgs.map((m, j) => (j === msgIndex && m.t === 'botreq' ? { ...m, done: 'cancelled' as const } : m)),
      }));
      void answerBotRequest(bid, { decision: 'cancel', error }).catch((err) =>
        console.error('[AppShell] bot request resolve failed:', err),
      );
      return;
    }
    void (async () => {
      // Lead-created bots join the lead's team, so the roster scope and team
      // directory pick them up immediately.
      const { botId, error } = await insertBot(target.name, false, target.role, target.description, chief.teamId ?? null);
      // insertBot prepends to the roster — shift selection so the chief thread stays open.
      setCur((c) => c + 1);
      const done: 'created' | 'cancelled' = botId ? 'created' : 'cancelled';
      patchChief((b) => ({
        ...b,
        msgs: b.msgs.map((m, j) => (j === msgIndex && m.t === 'botreq' ? { ...m, done } : m)),
      }));
      if (botId) void answerBotRequest(bid, { decision: 'confirm', botId }).catch((err) => console.error('[AppShell] bot request confirm failed:', err));
      else void answerBotRequest(bid, { decision: 'cancel', error: error ?? 'Create failed.' }).catch((err) => console.error('[AppShell] bot request resolve failed:', err));
    })();
  };

  const createBot = async (name: string, isChief: boolean): Promise<string | null> => {
    const { error } = await insertBot(name, isChief);
    if (!error) {
      setCur(0);
      setSideOpen(false);
    }
    return error;
  };

  // Team import: creates every member (+ lead) under one teamId, then
  // selects the lead so the user lands in the coordinating thread.
  const createTeam = async (team: TeamSpec): Promise<string | null> => {
    const ownerId = user?.userId;
    if (!ownerId) return 'Not signed in. Please sign in again.';
    try {
      const rows = await importTeam(ownerId, team, bots.map((b) => b.name));
      if (rows.length === 0) return 'Import created no bots.';
      setBots((prev) => [...rows.map(toViewBot), ...prev]);
      setCur(0);
      setSideOpen(false);
      return null;
    } catch (err) {
      console.error('[AppShell] team import failed:', err);
      return err instanceof Error ? err.message : 'Import failed. Check your connection and try again.';
    }
  };

  // Delete a whole team: removes every member bot server-side, then locally.
  const deleteTeam = (teamId: string, teamName: string) => {
    const members = bots.filter((b) => (b.teamId ?? null) === teamId && b.id);
    if (members.length === 0) return;
    if (!window.confirm(`Delete ${teamName} and its ${members.length} bot${members.length === 1 ? '' : 's'}?`)) return;
    const ids = new Set(members.map((m) => m.id));
    void (async () => {
      for (const m of members) {
        try {
          await deleteBotRow(m.id);
        } catch (err) {
          console.error('[AppShell] team member delete failed:', err);
        }
      }
      setBots((prev) => prev.filter((b) => !ids.has(b.id)));
      setCur(0);
    })();
  };

  // Model switch: persist to the bot, then reset the session — a new model
  // starts with a fresh context (selections are per-conversation).
  const changeModel = (model: string | null) => {
    const target = bots[cur];
    if (!target || target.busy || (target.model ?? null) === (model ?? null)) return;
    const targetId = target.id;
    void (async () => {
      try {
        await updateBotRow(targetId, { model });
        patchBotById(targetId, (b) => ({ ...b, model }));
        const cleared = await clearContext(targetId, model ?? undefined);
        patchBotById(targetId, (b) => ({
          ...b,
          msgs: [...b.msgs, { t: 'tool', x: `Context reset — fresh session on ${modelLabel(model)}.` }],
        }));
        setCtxById((prev) => ({ ...prev, [targetId]: cleared }));
      } catch (err) {
        console.error('[AppShell] model switch failed:', err instanceof Error ? err.message : err);
      }
    })();
  };

  const saveBotSkills = (enabled: string[] | null) => {
    const target = bots[cur];
    if (!target) return;
    patchBot(cur, (b) => ({ ...b, skillsEnabled: enabled }));
    // Sync best-effort — the picker already applied locally.
    void updateBotRow(target.id, { skillsEnabled: enabled }).catch((err) =>
      console.error('[AppShell] skills sync failed (applies next run):', err),
    );
  };

  const saveBotMcp = (enabled: string[] | null) => {
    const target = bots[cur];
    if (!target) return;
    patchBot(cur, (b) => ({ ...b, mcpEnabled: enabled }));
    // Sync best-effort — the picker already applied locally.
    void updateBotRow(target.id, { mcpEnabled: enabled }).catch((err) =>
      console.error('[AppShell] mcp sync failed (applies next run):', err),
    );
  };

  const q = query.toLowerCase();
  const items = bots
    .map((bot, index) => ({ bot, index }))
    .filter(({ bot }) => !q || `${bot.name}${bot.role}`.toLowerCase().includes(q));

  const saveBotEdits = async (edits: BotEdits): Promise<string | null> => {
    const target = bots[cur];
    if (!target) return 'No bot selected.';
    const normalized = edits.isChiefOfStaff && !edits.role.trim() ? { ...edits, role: 'Chief of staff' } : edits;
    try {
      // One chief of staff per team: unset the flag on same-team chiefs first.
      if (normalized.isChiefOfStaff && !target.isChiefOfStaff) {
        const others = bots.filter(
          (b) => b.isChiefOfStaff && b.id !== target.id && (b.teamId ?? null) === (target.teamId ?? null),
        );
        for (const o of others) {
          await updateBotRow(o.id, { isChiefOfStaff: false });
        }
        if (others.length > 0) {
          const ids = new Set(others.map((o) => o.id));
          setBots((prev) => prev.map((b) => (ids.has(b.id) ? { ...b, isChiefOfStaff: false } : b)));
        }
      }
      await updateBotRow(target.id, {
        name: normalized.name,
        role: normalized.role,
        isChiefOfStaff: normalized.isChiefOfStaff,
        color: normalized.color,
        shape: normalized.shape,
      });
      setBots((prev) => prev.map((b, i) => (i === cur ? { ...b, ...normalized } : b)));
      return null;
    } catch (err) {
      console.error('[AppShell] bot update failed:', err);
      return err instanceof Error ? err.message : 'Save failed. Check your connection and try again.';
    }
  };

  const deleteBot = async (): Promise<string | null> => {
    const target = bots[cur];
    if (!target) return 'No bot selected.';
    try {
      await deleteBotRow(target.id);
    } catch (err) {
      console.error('[AppShell] bot delete failed:', err);
      return err instanceof Error ? err.message : 'Delete failed. Check your connection and try again.';
    }
    setBots((prev) => prev.filter((_, i) => i !== cur));
    setCur((c) => Math.max(0, c - 1));
    setPanelOpen(false);
    return null;
  };

  const shell = (main: React.ReactNode, after?: React.ReactNode) => (
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
        onTeam={() => setTeamModalOpen(true)}
        onDeleteTeam={deleteTeam}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
      />
      {main}
      {after}
      <NewBotModal open={botModalOpen} onClose={() => setBotModalOpen(false)} onCreate={createBot} taken={bots.map((b) => b.name)} />
      <TeamPickerModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} onImport={createTeam} takenNames={bots.map((b) => b.name)} />
      {bot && (
        <>
          <SkillsPickerModal
            open={skillsOpen}
            onClose={() => setSkillsOpen(false)}
            botName={bot.name}
            enabled={bot.skillsEnabled}
            onSave={saveBotSkills}
          />
          <McpPickerModal
            open={mcpOpen}
            onClose={() => setMcpOpen(false)}
            botName={bot.name}
            enabled={bot.mcpEnabled}
            onSave={saveBotMcp}
          />
        </>
      )}
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
        <button
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          aria-label="Bot settings"
          className="mx-auto flex items-center gap-2.5 rounded-full bg-white py-2 pl-3 pr-5 font-bold text-navy shadow-md shadow-navy/5 hover:bg-slate-50"
        >
          <Mascot color={bot.color} shape={bot.shape} size="xs" motion="none" />
          <span>{bot.name}</span>
          <span className="hidden text-sm font-medium text-heroslate sm:inline">
            · {bot.role || 'No role yet'}
          </span>
        </button>
        <button
          onClick={() => setPanelOpen((o) => !o)}
          aria-label="Bot settings"
          aria-expanded={panelOpen}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-navy shadow-sm hover:bg-slate-50"
        >
          <PanelRight className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </header>

      {!computerReady && (
        <div className="mx-4 mb-1 flex items-center justify-center gap-2 rounded-full bg-bamber/25 px-4 py-1.5 text-center text-xs font-bold text-navy">
          {bootHint}
          {computerError && (
            <button onClick={() => retryComputerStart()} className="underline hover:no-underline">
              Retry
            </button>
          )}
        </div>
      )}

      <Thread
        bot={bot}
        isChief={bot.isChiefOfStaff ?? false}
        onApprove={approve}
        onAnswer={answer}
        onBotRequest={confirmBotRequest}
        onSuggest={(text) => sendText(text, [])}
      />
      <Composer
        botName={bot.name}
        draft={draft}
        onDraft={setDraft}
        onSend={send}
        onVoiceSend={(text) => sendText(text, [])}
        onOpenSkills={() => setSkillsOpen(true)}
        onOpenMcp={() => setMcpOpen(true)}
        model={bot.model ?? null}
        onModelChange={changeModel}
        ctx={bot.id ? (ctxById[bot.id] ?? null) : null}
        onCompact={() => compactNow(false)}
        compacting={compacting}
        ownerId={user?.userId}
        mentionNames={(() => {
          const scope = bot.isChiefOfStaff ? bots : bots.filter((b) => (b.teamId ?? null) === (bot.teamId ?? null));
          return scope.filter((b) => b.id && b.id !== bot.id).map((b) => b.name);
        })()}
        disabled={!computerReady || bot.busy}
        disabledHint={!computerReady ? bootHint : undefined}
        onRetry={!computerReady ? () => retryComputerStart() : undefined}
      />
    </main>,
    <BotPanel
      key={bot.id}
      open={panelOpen}
      onClose={() => setPanelOpen(false)}
      botId={bot.id}
      ownerId={user?.userId}
      name={bot.name}
      role={bot.role}
      description={bot.description}
      model={bot.model}
      isChiefOfStaff={bot.isChiefOfStaff ?? false}
      color={bot.color}
      shape={bot.shape}
      synced={bot.id !== null}
      onSave={saveBotEdits}
      onDelete={deleteBot}
    />,
  );
}
