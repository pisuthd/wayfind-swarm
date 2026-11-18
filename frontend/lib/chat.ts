// Thread message model (ported from the cloud app). Each Bot id is its
// conversation; history hydrates from the agent server, never DynamoDB.

export type Msg =
  | { t: 'u'; x: string; files?: string[] }
  | { t: 'b'; x: string }
  | { t: 'tool'; x: string }
  | { t: 'typing' }
  | { t: 'ask'; title: string; x: string; ok: string; after: string; done?: 'ok' | 'no'; approvalId?: string; permission?: string }
  | {
      t: 'q';
      qid: string;
      questions: Array<{
        question: string;
        header?: string;
        options: Array<{ label: string; description?: string }>;
      }>;
      done?: boolean;
    }
  | {
      t: 'botreq';
      bid: string;
      kind?: 'create' | 'update';
      /** update target bot name (equals name for updates). */
      target?: string;
      name: string;
      role?: string;
      description?: string;
      /** proposed new name for an update request. */
      newName?: string;
      done?: 'created' | 'updated' | 'cancelled';
    };

/** Minimal bot shape the Thread renders (AppShell's ViewBot satisfies this). */
export interface ThreadBot {
  name: string;
  role: string;
  msgs: Msg[];
}

export const FOLLOW_UP_NO = 'Okay, I’ve held it. Tell me what to change.';

/** Image progress rows render as skeleton bubbles; never persist them. */
export function isImageProgress(x: string): boolean {
  return x === 'Generating image…' || x === 'Editing image…';
}
