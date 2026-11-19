// Live run-event websocket: WS twin of GET /runs/:id/events for browser
// clients that want push instead of ~1s polling. Same event shapes as the
// SSE data lines, each tagged with its buffer cursor so a client that
// reconnects (or falls back to polling) resumes without replay or gaps.
//
// Frames out: { type:'hello', cursor } once, then buffered run events as
// { ...event, cursor }, { type:'ping' } every ~15s of silence.
// Auth rides the Lambda proxy subprotocols (same as /term) — no app-level
// check here, mirroring the terminal server.
import type { Server } from 'node:http';
import type { Socket } from 'node:net';
import { WebSocketServer, type WebSocket } from 'ws';
import { getRun } from './runner.js';

const HELLO = 'hello';
const TICK_MS = 250;
const PING_EVERY_TICKS = 60; // ~15s of silence
const IDLE_KILL_MS = 15 * 60_000;

export function attachRunStreamServer(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket: Socket, head: Buffer) => {
    let pathname = '';
    let startCursor = 0;
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      pathname = url.pathname;
      startCursor = Math.max(0, Number(url.searchParams.get('cursor') ?? 0) || 0);
    } catch {
      socket.destroy();
      return;
    }
    const match = pathname.match(/^\/runs\/([A-Za-z0-9-]+)\/events$/);
    if (!match) return; // not ours — leave for other upgrade handlers
    wss.handleUpgrade(req, socket, head, (ws) => openStream(ws, match[1], startCursor));
  });

  function openStream(ws: WebSocket, runId: string, startCursor: number): void {
    let cursor = startCursor;
    let ticks = 0;
    let done = false;
    const send = (obj: unknown): void => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
    };
    send({ type: HELLO, cursor });
    const timer = setInterval(() => {
      const r = getRun(runId);
      if (!r) {
        send({ type: 'error', error: 'unknown run' });
        close();
        return;
      }
      while (cursor < r.events.length) {
        send({ ...r.events[cursor], cursor });
        cursor += 1;
      }
      ticks += 1;
      if (ticks % PING_EVERY_TICKS === 0) send({ type: 'ping' });
      if (r.done) close();
    }, TICK_MS);
    if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
      (timer as unknown as { unref: () => void }).unref();
    }
    const idle = setTimeout(close, IDLE_KILL_MS);
    if (typeof (idle as unknown as { unref?: () => void }).unref === 'function') {
      (idle as unknown as { unref: () => void }).unref();
    }
    function close(): void {
      if (done) return;
      done = true;
      clearInterval(timer);
      clearTimeout(idle);
      try {
        ws.close();
      } catch {
        // already closed
      }
    }
    ws.on('close', close);
    ws.on('error', close);
  }
}
