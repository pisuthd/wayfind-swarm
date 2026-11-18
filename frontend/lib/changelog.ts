// User-facing changelog — single source for /docs/changelog.
// Plain words only: no internal codenames, no infra trivia.
// Newest entry first. Add a new entry per release (see docs plan:
// bump version -> entry here -> deploy -> push).
export interface ChangelogEntry {
  version: string;
  date: string;
  tagline: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.4.0',
    date: '2026-11-18',
    tagline: 'Early-access billing, browser-verified QA, and one import per gateway.',
    added: [
      'Usage panel with spend-against-cap bar, spend-by-model breakdown, and recent runs — plus a $1 monthly cap that pauses sends instead of surprising you.',
      'QA engineers verify web work in a real browser and report pass/fail with screenshots.',
      'Importing any connector lights up its whole gateway: one Zoho import covers every Zoho app, one Web3 import covers them all.',
    ],
    changed: [
      'Early access starts with the Software Development team; Design Studio and Video Production are coming soon.',
      'Greeting suggestion cards removed for a cleaner start — tutorials arrive later.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-18',
    tagline: 'Hire whole teams in one click, and every bot can talk to its teammates.',
    added: [
      'Start a team — Software Development, Design Studio, or Video Production, each arriving with its own lead.',
      'Any bot can @mention any teammate; leads can reach across teams and update their own members by chat.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-11-13',
    tagline: 'Bots can now use crypto wallets, and the API powers verifiable sandbox runs.',
    added: [
      'Web3 Gateway connectors — Wallet Essentials, OKX DEX Swaps, and Stablecoin Finance. Open Connectors, pick one, and paste your endpoint from web3.wayfind.click, where email sign-in creates your wallet.',
      'Wayfind ONE backend — disposable attested sandboxes with sealed file intake, signed execution receipts, and verification endpoints, now running on this API.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-11-06',
    tagline: 'Member bots can now ask your chief of staff for help.',
    added: [
      'In any member bot’s chat you can @mention your chief of staff — they answer in their own role and the reply is relayed back to you.',
      'Your other bots stay hidden from members: each member bot only ever sees the chief.',
      'New greeting suggestion in member chats points at the chief when you need a hand.',
    ],
  },
];
