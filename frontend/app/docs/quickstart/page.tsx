import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, H2, P, Step, Steps } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Quickstart — Wayfind Docs',
  description: 'Five steps from signup to finished work with your first AI team.',
};

export default function DocsQuickstartPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Quickstart</h1>
      <P>
        Five steps from signup to finished work. Most people finish in under ten minutes — the
        longest step is describing the job well.
      </P>

      <Steps>
        <Step title="1">
          <strong>Start free.</strong> Head to <Link href="/app" className="font-bold text-cta hover:underline">the app</Link> and
          sign in. No credit card required — early access includes $1 of credit to try things out.
        </Step>
        <Step title="2">
          <strong>Hire a team.</strong> Hit <strong>Start a team</strong> in the roster and pick{' '}
          <strong>Software Development</strong>: a tech lead, a frontend and a backend developer,
          and a QA engineer, arriving in one click.
        </Step>
        <Step title="3">
          <strong>Give it a job.</strong> Tell the lead what you want in plain language —
          “build me a landing page for my bakery” beats “make a website”, because specifics shape
          the result. The lead splits the work across teammates automatically.
        </Step>
        <Step title="4">
          <strong>Watch the preview.</strong> Frontend work serves on port 5173: open{' '}
          <strong>Computer → Preview</strong> in the app and enter the port. QA verifies the result
          in a real browser before it&apos;s called done.
        </Step>
        <Step title="5">
          <strong>Stay in charge.</strong> Anything sensitive — sending, paying, publishing,
          changing important records — pauses for your approval first. Make a job recurring and it
          becomes a <Link href="/docs/routines" className="font-bold text-cta hover:underline">routine</Link>.
        </Step>
      </Steps>

      <H2 id="approvals">Approvals keep you in charge</H2>
      <P>
        Bots run on their own but stop for your OK before anything that matters. You don&apos;t need
        to watch every step — just the ones with consequences.
      </P>

      <Callout kind="tip">
        Connectors are shared across your whole team: import an app once, and every bot can use
        it immediately. See <Link href="/docs/connectors" className="font-bold text-cta hover:underline">Connectors</Link>.
      </Callout>
    </article>
  );
}
