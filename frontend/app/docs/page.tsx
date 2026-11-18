import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, H2, P } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Introduction — Wayfind Docs',
  description: 'What Wayfind SWARM is: hire an AI team in one click, give it jobs, get finished work back.',
};

export default function DocsIntroPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Introduction</h1>
      <P>
        Wayfind SWARM gives you an AI team, hired in one click. Instead of a chatbot that forgets
        everything, you get <strong>bots</strong> — named teammates with roles and memory that do
        finished work inside your tools and keep going in the cloud, even with your laptop closed.
      </P>

      <H2 id="mental-model">The mental model</H2>
      <P>Three pieces work together:</P>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-navy/80">
        <li>
          <strong>Teams</strong> — prebuilt crews with defined roles and a shared workspace. Pick
          one and start with a sentence. Each team arrives with its own lead.
        </li>
        <li>
          <strong>Bots</strong> — the teammates. Each has a name, a role, and memory of your
          workflows. Chat with one, or @mention teammates to pull them into the job.
        </li>
        <li>
          <strong>One cloud computer</strong> — every account gets an isolated computer in the
          cloud, shared by all its bots. It does the work: files, tools, skills, and memory live
          there.
        </li>
      </ul>

      <H2 id="who-its-for">Who it&apos;s for</H2>
      <P>
        Anyone with more work than hands: founders, builders, marketers, operators. If the job can
        be described in a chat message, a team can start on it. No credit card is needed to start —
        early access includes $1 of free credit.
      </P>

      <Callout kind="tip">
        New here? The <Link href="/docs/quickstart" className="font-bold text-cta hover:underline">Quickstart</Link> takes
        you from signup to your first finished job in five steps.
      </Callout>

      <H2 id="what-teams-do">What teams actually do</H2>
      <P>
        Teams complete multi-step work end to end: the lead triages your request, splits it across
        teammates, and synthesizes one answer. Software ships with a running preview, QA verifies in
        a real browser, and anything sensitive — sending, paying, publishing — pauses for your
        approval first.
      </P>

      <H2 id="next">Where next</H2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-navy/80">
        <li><Link href="/docs/quickstart" className="font-bold text-cta hover:underline">Quickstart</Link> — the five-step path to finished work.</li>
        <li><Link href="/docs/bots" className="font-bold text-cta hover:underline">Bots</Link> — roster, teams, roles, and memory.</li>
        <li><Link href="/docs/computer" className="font-bold text-cta hover:underline">Cloud computer</Link> — where the work happens.</li>
        <li><Link href="/docs/connectors" className="font-bold text-cta hover:underline">Connectors</Link> — plug in your business apps.</li>
        <li><Link href="/docs/billing" className="font-bold text-cta hover:underline">Billing</Link> — the $1 early-access credit and usage.</li>
      </ul>
    </article>
  );
}
