import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, H2, H3, P } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Bots — Wayfind Docs',
  description: 'Bots in Wayfind SWARM: teams, roster, roles, @mentions, memory, and skills.',
};

export default function DocsBotsPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Bots</h1>
      <P>
        Bots are the teammates. Each one has a name, a role, and memory — chat with them in the
        roster, hand off jobs, and come back to finished results.
      </P>

      <H2 id="teams">Teams</H2>
      <P>
        The fastest way to staff up is <strong>Start a team</strong> in the roster: one click hires
        a whole crew under its own lead. <strong>Software Development</strong> (tech lead,
        frontend, backend, QA) is available now; Design Studio and Video Production are coming
        soon. Bots without a team land in <strong>My team</strong>, your default crew.
      </P>

      <H2 id="roster">The roster</H2>
      <P>
        The left sidebar lists every bot on your teams. Selecting one opens its conversation;
        unread work and pending approvals surface there. Leads see every team; members see their
        own team only.
      </P>

      <H2 id="creating">Creating a bot</H2>
      <P>
        Create a bot with a name and a role that describes its job — “Aria — bookkeeping” beats
        “Assistant”, because the role shapes how it works and what it remembers. Pick a color and
        shape so you can spot it at a glance. Asking a lead in chat can also create bots for you,
        confirmed on a card first.
      </P>
      <Callout kind="tip">
        One bot per job works best. A bookkeeping bot and a support bot stay sharper than one
        generalist trying to do both.
      </Callout>

      <H2 id="mentions">Working as a team</H2>
      <P>
        Bots can consult each other with <strong>@mentions</strong>: a lead triages your request,
        delegates pieces to teammates, and synthesizes one answer back. Ask any bot for help with
        “ask the team”, or address a teammate directly with @Name.
      </P>

      <H3 id="qa">QA in a real browser</H3>
      <P>
        The QA engineer verifies web work in a real headless browser before it&apos;s called done:
        clicking through pages and confirming each operation, with screenshots as evidence.
      </P>

      <H2 id="memory">Memory</H2>
      <P>
        Bots remember your workflows across conversations: how you like invoices reconciled, what
        “the weekly report” means. Corrections stick — tell a bot once and it applies from then on.
      </P>

      <H2 id="skills">Skills</H2>
      <P>
        Skills are know-how bundles the computer keeps ready: frontend and backend engineering
        guides, React performance rules, browser automation. Each bot is allowed only the skills
        for its job — manage them from the bot&apos;s Skills panel.
      </P>

      <H2 id="conversations">Conversations</H2>
      <P>
        Every bot keeps its own conversation history. Ask follow-ups in the same thread and the bot
        keeps context; start fresh any time. Long-running work continues in the background on your
        cloud computer — close the laptop, come back to the result.
      </P>

      <H3 id="background-work">Background work</H3>
      <P>
        Bots can run routines on their own and check in when they need you. Anything sensitive —
        sending, paying, publishing, changing important records — pauses for your approval first.
        See <Link href="/docs/computer" className="font-bold text-cta hover:underline">Cloud computer</Link> for
        where this work runs.
      </P>
    </article>
  );
}
