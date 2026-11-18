'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import Markdown from './Markdown';
import VmImage from './VmImage';
import { isImageProgress, type Msg, type ThreadBot } from '@/lib/chat';
import { viewFileUrl } from '@/lib/agent';

/** Split a user message into display text + attached workspace paths.
/// Live messages carry files[]; rehydrated history carries an
/// "[attached: a, b]" marker (bytes are never persisted). */
function splitAttachments(m: Extract<Msg, { t: 'u' }>): { text: string; files: string[] } {
  if (m.files?.length) return { text: m.x, files: m.files };
  const match = m.x.match(/ \[attached: ([^\]]+)\]$/);
  if (!match) return { text: m.x, files: [] };
  return { text: m.x.slice(0, match.index), files: match[1].split(',').map((s) => s.trim()).filter(Boolean) };
}

function isImagePath(p: string): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(p);
}

interface ThreadProps {
  bot: ThreadBot;
  isChief?: boolean;
  onApprove: (msgIndex: number, decision: 'approve' | 'reject' | 'approve-all') => void;
  onAnswer?: (msgIndex: number, answers: string[][]) => void;
  /** Per-question pick (undefined clears). No server call — the card submits
   * one batch via onAnswer once every question is answered or skipped. */
  onSelectQuestion?: (msgIndex: number, qi: number, sel: string[] | undefined) => void;
  onBotRequest?: (msgIndex: number, ok: boolean) => void;
  onSuggest?: (text: string) => void;
}



/** Elapsed run clock for the typing row — ticks locally so the thread only
 * re-renders this bubble, not the whole list, every second. */
function RunClock({ since }: { since: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((Date.now() - since) / 1000));
  const label = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  return <span className="tabular-nums">working · {label}</span>;
}

/** Run-level status pill: persistent elapsed clock for the whole run, plus a
 * staleness warning when no run event has arrived for a while — so a quiet
 * bot reads as "still working" instead of "frozen". Ticks locally. */
export function RunStatus({ startedAt, lastEventAt }: { startedAt: number; lastEventAt: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const label = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
  const gap = Math.max(0, Math.floor((Date.now() - lastEventAt) / 1000));
  const stale = gap >= 15;
  return (
    <div className="mx-4 mb-1 flex items-center justify-center">
      <span
        className={`rounded-full px-4 py-1.5 text-center text-xs font-bold tabular-nums ${
          stale ? 'bg-bamber/25 text-navy' : 'bg-white text-heroslate shadow-sm'
        }`}
      >
        working · {label}
        {stale && <span> · last update {gap}s ago</span>}
      </span>
    </div>
  );
}

/** Free-text answer row inside a question card. Sends the typed text as the answer. */
function CustomAnswer({ onSend, secret }: { onSend: (text: string) => void; secret?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-dashed border-navy/25 px-3.5 py-2 text-left text-sm font-semibold text-heroslate hover:border-cta hover:text-cta"
      >
        Other… (type your own)
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = text.trim();
        if (v) onSend(v);
      }}
      className="flex gap-2"
    >
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus -- user explicitly opened this row
        autoFocus
        type={secret ? 'password' : 'text'}
        autoComplete="off"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your answer…"
        className="min-w-0 flex-1 rounded-xl border border-navy/20 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-cta"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="shrink-0 rounded-xl bg-cta px-4 py-2 text-sm font-bold text-white hover:bg-ctahover disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}

function ApprovalCard({ msg, onOk, onNo, onAll }: { msg: Extract<Msg, { t: 'ask' }>; onOk: () => void; onNo: () => void; onAll: () => void }) {  return (
    <div className="msg-in rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="font-bold text-navy">{msg.title}</p>
      <p className="mt-1 text-heroslate">{msg.x}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {msg.done === undefined ? (
          <>
            <button
              onClick={onOk}
              className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1c3350]"
            >
              {msg.ok}
            </button>
            {msg.permission === 'shell' && (
              <button
                onClick={onAll}
                className="rounded-full border border-navy/30 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-slate-50"
                title="Auto-approve every shell command for the rest of this run. Never saved."
              >
                Allow all shell this run
              </button>
            )}
            <button
              onClick={onNo}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-slate-50"
            >
              Not now
            </button>
          </>
        ) : (
          <span className={`text-sm font-bold ${msg.done === 'ok' ? 'text-blagoon' : 'text-slate-400'}`}>
            {msg.done === 'ok' ? '✓ Approved' : 'Declined'}
          </span>
        )}
      </div>
    </div>
  );
}

/** Multi-question card: each question is answered independently and the card
 * submits one positional batch only when every question is answered or
 * skipped — answering Q1 no longer closes Q2. */
function QuestionCard({
  msg,
  msgIndex,
  onSelect,
  onAnswer,
}: {
  msg: Extract<Msg, { t: 'q' }>;
  msgIndex: number;
  onSelect?: (msgIndex: number, qi: number, sel: string[] | undefined) => void;
  onAnswer?: (msgIndex: number, answers: string[][]) => void;
}) {
  const total = msg.questions.length;
  const sels = msg.selections ?? [];
  const allAnswered = total > 0 && sels.length === total && sels.every((s) => s !== undefined);
  return (
    <div className="msg-in rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {msg.questions.map((q, qi) => {
        const sel = sels[qi];
        const answeredQi = sel !== undefined;
        return (
          <div key={qi} className={qi > 0 ? 'mt-3 border-t border-slate-100 pt-3' : ''}>
            {q.header && <p className="text-xs font-bold uppercase tracking-wide text-cta">{q.header}</p>}
            <p className="mt-0.5 font-bold text-navy">{q.question}</p>
            {msg.done === true || answeredQi ? (
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-semibold text-navy">{sel && sel.length > 0 ? sel.join(', ') : 'Skipped'}</span>
                {msg.done !== true && (
                  <button
                    onClick={() => onSelect?.(msgIndex, qi, undefined)}
                    className="font-semibold text-heroslate underline hover:text-cta"
                  >
                    Change
                  </button>
                )}
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                {q.options.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => onSelect?.(msgIndex, qi, [o.label])}
                    className="rounded-xl border border-navy/20 px-3.5 py-2 text-left hover:border-cta hover:bg-cta/5"
                  >
                    <span className="block text-sm font-bold text-navy">{o.label}</span>
                    {o.description && <span className="mt-0.5 block text-xs text-heroslate">{o.description}</span>}
                  </button>
                ))}
                <CustomAnswer
                  key={`custom-${qi}`}
                  secret={/passkey|password|secret|api[-_ ]?key|token|mnemonic|private/i.test(
                    `${q.header ?? ''} ${q.question}`,
                  )}
                  onSend={(text) => onSelect?.(msgIndex, qi, [text])}
                />
                <button
                  onClick={() => onSelect?.(msgIndex, qi, [])}
                  className="rounded-xl px-3.5 py-1.5 text-left text-sm font-semibold text-heroslate hover:bg-slate-50"
                >
                  Skip
                </button>
              </div>
            )}
          </div>
        );
      })}
      {msg.done === true ? (
        <p className="mt-2 text-sm font-bold text-blagoon">✓ Answered</p>
      ) : (
        <button
          disabled={!allAnswered}
          onClick={() => onAnswer?.(msgIndex, msg.questions.map((_, j) => sels[j] ?? []))}
          className="mt-3 w-full rounded-xl bg-cta px-4 py-2 text-sm font-bold text-white hover:bg-ctahover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {allAnswered ? 'Send answers' : `Answer all questions (${sels.filter((s) => s !== undefined).length}/${total})`}
        </button>
      )}
    </div>
  );
}

export default function Thread({ bot, isChief, onApprove, onAnswer, onSelectQuestion, onBotRequest, onSuggest }: ThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Suggestions live only on the untouched greeting: one AI message and
  // nothing else — a tap appends the user message and hides them instantly.
  const showSuggestions =
    bot.msgs.filter((m) => m.t === 'b').length === 1 &&
    !bot.msgs.some((m) => m.t === 'u' || m.t === 'typing');

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bot]);

  return (
    <div ref={scrollRef} className="thread-scroll flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 text-[15px]">
        {bot.msgs.map((m, i) => {
          if (m.t === 'u') {
            const { text, files } = splitAttachments(m);
            return (
              <div key={i} className="msg-in ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-cta px-4 py-2.5 text-white">
                {files.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {files.map((p) => (
                      <span key={p} title={p} className="inline-flex items-center gap-1 rounded-lg bg-white/20 p-1">
                        {isImagePath(p) ? (
                          <VmImage src={viewFileUrl(p)} alt={p} className="h-14 w-14 rounded-md object-cover" />
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1 text-xs font-semibold">
                            <FileText className="h-4 w-4" />
                            {p.split('/').pop()}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {text}
              </div>
            );
          }
          if (m.t === 'b') {
            return (
              <div key={i} className="msg-in max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-navy shadow-sm">
                <Markdown text={m.x} />
              </div>
            );
          }
          if (m.t === 'tool') {
            // Image generation/editing shows a skeleton bubble while the
            // image model works — the finished image arrives as markdown below.
            if (m.x === 'Generating image…' || m.x === 'Editing image…') {
              return (
                <div key={i} className="msg-in w-full rounded-2xl rounded-bl-sm bg-white p-3 shadow-sm">
                  <div className="aspect-video w-full animate-pulse rounded-2xl bg-gradient-to-br from-ice via-slate-200 to-ice" />
                  <p className="mt-2 text-xs font-semibold text-heroslate">{m.x}</p>
                </div>
              );
            }
            const dot = m.x.endsWith('failed')
              ? 'bg-red-500'
              : m.x.endsWith('finished')
                ? 'bg-blagoon'
                : m.x.endsWith('started')
                  ? 'bg-bamber animate-pulse'
                  : 'bg-blagoon';
            return (
              <div key={i} className="msg-in flex items-center gap-2 px-1 text-xs font-semibold text-heroslate">
                <i className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                <span>{m.x}</span>
              </div>
            );
          }
          if (m.t === 'q') {
            return <QuestionCard key={i} msg={m} msgIndex={i} onSelect={onSelectQuestion} onAnswer={onAnswer} />;
          }
          if (m.t === 'typing') {
            // Last activity = most recent tool row (skips image-progress
            // skeletons). Zero new state — derived from the messages.
            let activity: string | null = null;
            for (let j = bot.msgs.length - 1; j >= 0; j -= 1) {
              const prev = bot.msgs[j];
              if (prev.t === 'tool' && !isImageProgress(prev.x)) {
                activity = prev.x;
                break;
              }
            }
            return (
              <div key={i} className="msg-in w-fit max-w-full rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                <span className="flex items-center gap-2">
                  <span className="typing-dots flex gap-1">
                    <i className="h-2 w-2 rounded-full bg-slate-400" />
                    <i className="h-2 w-2 rounded-full bg-slate-400" />
                    <i className="h-2 w-2 rounded-full bg-slate-400" />
                  </span>
                  {typeof m.since === 'number' && (
                    <span className="text-xs font-semibold text-heroslate">
                      <RunClock since={m.since} />
                    </span>
                  )}
                </span>
                {activity && (
                  <p className="mt-1 truncate text-xs text-heroslate/80" title={activity}>
                    {activity}
                  </p>
                )}
              </div>
            );
          }
          if (m.t === 'botreq') {
            const isUpdate = m.kind === 'update';
            return (
              <div key={i} className="msg-in rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-cta">{isUpdate ? 'Update Bot' : 'New Bot'}</p>
                <p className="mt-0.5 font-bold text-navy">
                  {isUpdate ? (m.target ?? m.name) : m.name}
                  {!isUpdate && m.role && <span className="font-medium text-heroslate"> · {m.role}</span>}
                </p>
                {isUpdate ? (
                  <ul className="mt-1 space-y-0.5 text-sm text-heroslate">
                    {m.newName && (
                      <li>
                        Name → <span className="font-semibold text-navy">{m.newName}</span>
                      </li>
                    )}
                    {m.role && (
                      <li>
                        Role → <span className="font-semibold text-navy">{m.role}</span>
                      </li>
                    )}
                    {m.description && (
                      <li>
                        Brief → <span className="font-semibold text-navy">{m.description}</span>
                      </li>
                    )}
                  </ul>
                ) : (
                  m.description && <p className="mt-1 text-sm text-heroslate">{m.description}</p>
                )}
                {m.done === undefined ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onBotRequest?.(i, true)}
                      className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#1c3350]"
                    >
                      {isUpdate ? 'Apply update' : 'Create Bot'}
                    </button>
                    <button
                      onClick={() => onBotRequest?.(i, false)}
                      className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-slate-50"
                    >
                      Not now
                    </button>
                  </div>
                ) : (
                  <p className={`mt-2 text-sm font-bold ${m.done === 'cancelled' ? 'text-slate-400' : 'text-blagoon'}`}>
                    {m.done === 'created' ? '✓ Created' : m.done === 'updated' ? '✓ Updated' : 'Declined'}
                  </p>
                )}
              </div>
            );
          }
          return <ApprovalCard key={i} msg={m} onOk={() => onApprove(i, 'approve')} onNo={() => onApprove(i, 'reject')} onAll={() => onApprove(i, 'approve-all')} />;
        })}
      </div>
    </div>
  );
}
