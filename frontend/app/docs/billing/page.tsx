import type { Metadata } from 'next';
import { Callout, DocTable, H2, P } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Billing — Wayfind Docs',
  description: 'Wayfind SWARM billing: the $1 early-access credit, the monthly cap, and the Usage panel.',
};

export default function DocsBillingPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Billing</h1>
      <P>
        Early access is simple: every account starts with <strong>$1 of free credit</strong>. Model
        calls draw it down; when it&apos;s gone for the month, sends pause until next month. Paid
        top-ups are coming soon.
      </P>

      <H2 id="cap">The monthly cap</H2>
      <P>
        Spend is capped at $1 per calendar month. The app checks before every run — at or over the
        cap, new sends are refused with a notice instead of starting. The cap resets on the 1st.
        Hello intros are exempt, so a fresh thread never greets you with a billing error.
      </P>
      <Callout kind="tip">
        Unpriced providers meter tokens but bill $0, so the cap only binds once priced spend
        lands. The Usage panel shows which is which.
      </Callout>

      <H2 id="usage">Watching usage</H2>
      <P>
        Open <strong>Usage</strong> in the profile menu any time: billed spend against the $1 cap
        with a progress bar, token and tool-call stats by day, week, or month, a spend-by-model
        breakdown, and the recent runs behind the numbers. Everything the cap counts is visible
        there.
      </P>

      <H2 id="models">What costs what</H2>
      <P>
        Chat models bill from published per-token rates (see{' '}
        <a href="/docs/models" className="font-bold text-cta hover:underline">Models</a>); images
        bill a flat rate per successful render. The Usage panel breaks spend down by model, so you
        can see exactly where the work went.
      </P>

      <DocTable
        head={['Activity', 'How it bills']}
        rows={[
          ['Chat and tool calls', 'Per-token, from published provider rates.'],
          ['Image generation', 'Flat rate per successful image.'],
          ['QA browser runs', 'Test-cloud credits, currently off-ledger — visible in the provider dashboard, not the Usage panel.'],
        ]}
      />
    </article>
  );
}
