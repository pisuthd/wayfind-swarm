import { createBotRow, updateBotRow, type BotRow } from './bots';

export interface TeamMemberSpec {
  name: string;
  role: string;
  description: string;
  color: string;
  shape: string;
  lead?: boolean;
  model?: string;
  skills?: string[] | null;
  mcp?: string[] | null;
}

export interface TeamSpec {
  id: string;
  name: string;
  blurb: string;
  members: TeamMemberSpec[];
}

/** One-click team templates, mirroring the landing Teams section.
 * The lead member (Tech Lead / Creative Director / Producer) is flagged
 * chief-of-staff: one chief per team, coordinating via @mentions. */
export const TEAMS: TeamSpec[] = [
  {
    id: 'software-dev',
    name: 'Software Development',
    blurb: 'Ship features end to end.',
    members: [
      {
        name: 'Taylor',
        role: 'Tech Lead',
        description:
          'You lead this team. Triage the user\u2019s request, split it across your teammates with @mentions, and synthesize their replies into one answer. Own the dev server and the build.',
        color: 'blue',
        shape: 'squircle',
        lead: true,
      },
      {
        name: 'Reef',
        role: 'Frontend developer',
        description:
          'You build user interfaces with React, Vite, and Tailwind. Run the dev server on port 5173 so the user can preview. ' +
          'You have the vercel-react-best-practices and frontend-ui-engineering skills — load the relevant one with the skill tool before writing or reviewing any UI code.',
        color: 'lagoon',
        shape: 'blob',
        skills: ['vercel-react-best-practices', 'frontend-ui-engineering'],
      },
      {
        name: 'Moss',
        role: 'Backend developer',
        description:
          'You build APIs and data models. Keep endpoints OpenAI-compatible and documented. ' +
          'You have the backend-craft and backend-architecture skills — load the relevant one with the skill tool before writing or reviewing any backend code.',
        color: 'moss',
        shape: 'circle',
        skills: ['backend-craft', 'backend-architecture'],
      },
      {
        name: 'Ash',
        role: 'QA engineer',
        description: 'You verify before anything ships: reproduce bugs, probe endpoints, and report pass/fail plainly.',
        color: 'ash',
        shape: 'pebble',
      },
    ],
  },
  {
    id: 'design-studio',
    name: 'Design Studio',
    blurb: 'From brief to polished mock.',
    members: [
      {
        name: 'Aria',
        role: 'Creative Director',
        description:
          'You lead this team. Hold the brief, give art direction, delegate pieces to your teammates with @mentions, and consolidate their work into one coherent direction.',
        color: 'grape',
        shape: 'squircle',
        lead: true,
      },
      {
        name: 'Coral',
        role: 'UI designer',
        description: 'You design interfaces: layout, color, type. Produce mockups as browsable HTML the user can preview.',
        color: 'coral',
        shape: 'circle',
      },
      {
        name: 'Dune',
        role: 'Copywriter',
        description: 'You write the words: headlines, landing copy, empty states. Match the user\u2019s voice, keep it tight.',
        color: 'amber',
        shape: 'blob',
      },
      {
        name: 'Fern',
        role: 'Brand designer',
        description: 'You own the visual identity: palette, mascots, illustration style. Keep every asset on-brand.',
        color: 'moss',
        shape: 'pebble',
      },
    ],
  },
  {
    id: 'video-production',
    name: 'Video Production',
    blurb: 'Script to final cut.',
    members: [
      {
        name: 'Producer',
        role: 'Producer',
        description:
          'You lead this team. Plan the production (script \u2192 shots \u2192 edit), delegate to your teammates with @mentions, and keep the cut on schedule.',
        color: 'amber',
        shape: 'squircle',
        lead: true,
      },
      {
        name: 'Wren',
        role: 'Scriptwriter',
        description: 'You write scripts, shot lists, and voiceover copy. Structure first, dialogue second.',
        color: 'blue',
        shape: 'circle',
      },
      {
        name: 'Tide',
        role: 'Editor',
        description: 'You assemble the cut: pacing, selects, captions, and export specs for each platform.',
        color: 'lagoon',
        shape: 'blob',
      },
      {
        name: 'Kelp',
        role: 'Researcher',
        description: 'You gather references, facts, music and stock options. Cite sources for everything.',
        color: 'ash',
        shape: 'pebble',
      },
    ],
  },
];

/** Import a whole team: creates every member (+ lead flagged chief) under
 * one teamId. Names collide-safe against the user's existing bots. */
export async function importTeam(ownerId: string, team: TeamSpec, taken: string[]): Promise<BotRow[]> {
  const lower = new Set(taken.map((t) => t.toLowerCase()));
  const teamId = `team-${team.id}-${Date.now().toString(36)}`;
  const rows: BotRow[] = [];
  for (const m of team.members) {
    let name = m.name;
    for (let i = 2; lower.has(name.toLowerCase()); i += 1) name = `${m.name} ${i}`;
    lower.add(name.toLowerCase());
    const row = await createBotRow({
      ownerId,
      teamId,
      name,
      role: m.role,
      description: m.description,
      ...(m.lead ? { isChiefOfStaff: true } : {}),
      color: m.color,
      shape: m.shape,
    });
    // createBotRow has no skills field — apply the allowlist right after.
    if (m.skills) {
      await updateBotRow(row.id, { skillsEnabled: m.skills });
      rows.push({ ...row, skillsEnabled: m.skills });
    } else {
      rows.push(row);
    }
  }
  return rows;
}
