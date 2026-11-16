'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { computerToken } from '@/lib/wayfind-api';

type Status = 'connecting' | 'open' | 'closed' | 'error';

export interface TermMeta {
  shell?: string;
  os?: string;
  cols?: number;
  rows?: number;
}

export default function TerminalView({ endpoint, onExit, onMeta }: { endpoint: string; onExit?: (code: number) => void; onMeta?: (m: TermMeta) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let term: Terminal | null = null;
    let fit: FitAddon | null = null;
    let ws: WebSocket | null = null;
    let disposed = false;

    void (async () => {
      try {
        const { authToken } = (await computerToken(15)) as { authToken: string };
        if (disposed || !hostRef.current) return;
        term = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          lineHeight: 1.4,
          fontFamily: "var(--font-jbmono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          theme: { background: '#0E1B2C' },
        });
        fit = new FitAddon();
        term.loadAddon(fit);
        term.open(hostRef.current);
        fit.fit();
        term.focus();
        term.write('Connecting…\r\n');

        ws = new WebSocket(`wss://${endpoint}/term`, [
          'lambda-microvms',
          `lambda-microvms.authentication.${authToken}`,
          'lambda-microvms.port.8080',
        ]);
        ws.onopen = () => {
          if (disposed) return;
          setStatus('open');
          const dims = fit?.proposeDimensions();
          if (dims) {
            ws?.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
            onMeta?.({ cols: dims.cols, rows: dims.rows });
          }
          const onResize = () => {
            fit?.fit();
            const d = fit?.proposeDimensions();
            if (d) {
              ws?.send(JSON.stringify({ type: 'resize', cols: d.cols, rows: d.rows }));
              onMeta?.({ cols: d.cols, rows: d.rows });
            }
          };
          window.addEventListener('resize', onResize);
          (ws as WebSocket & { __onResize?: () => void }).__onResize = onResize;
        };
        ws.onmessage = (ev: MessageEvent) => {
          try {
            const m = JSON.parse(String(ev.data));
            if (m.type === 'output' && typeof m.data === 'string') term?.write(m.data);
            else if (m.type === 'exit') {
              term?.write(`\r\n[session ended: ${m.code ?? m.reason ?? 'closed'}]\r\n`);
              setStatus('closed');
              onExit?.(typeof m.code === 'number' ? m.code : -1);
            } else if (m.type === 'error') {
              term?.write(`\r\n[terminal error: ${m.error}]\r\n`);
              setStatus('error');
              setError(String(m.error));
            }
          } catch {
            // non-JSON frames ignored
          }
        };
        ws.onerror = () => {
          if (!disposed) {
            setStatus('error');
            setError('Connection failed. The computer may be asleep — retry in a moment.');
          }
        };
        ws.onclose = () => {
          if (!disposed) setStatus((s) => (s === 'open' ? 'closed' : s));
        };
        term.onData((data) => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data }));
        });
      } catch (err) {
        if (!disposed) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Failed to open terminal.');
        }
      }
    })();

    return () => {
      disposed = true;
      try {
        const onResize = (ws as unknown as { __onResize?: () => void } | null)?.__onResize;
        if (onResize) window.removeEventListener('resize', onResize);
      } catch {
        // ignore
      }
      try {
        ws?.close();
      } catch {
        // ignore
      }
      try {
        term?.dispose();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full overflow-hidden" />
      {status !== 'open' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center gap-2 px-4 py-2 text-xs text-white/60">
          {status === 'connecting' && <span>Connecting…</span>}
          {status === 'closed' && <span>Session closed.</span>}
          {status === 'error' && <span className="text-red-300">{error ?? 'Connection failed.'}</span>}
        </div>
      )}
    </div>
  );
}
