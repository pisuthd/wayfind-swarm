'use client';

import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onSignIn: () => void;
}

export default function Hero({ onSignIn }: HeroProps) {
  return (
    <header className="mx-auto max-w-6xl px-6 pb-16 pt-6 md:pb-24 md:pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/70">
          AI teams, ready for hire
      </p>
      <h1 className="mt-6 max-w-4xl font-brico text-5xl font-bold leading-[1.0] md:text-8xl">
          An entire team, hired in one click.
      </h1>
      <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <p className="max-w-md text-lg leading-relaxed text-ink">
          You bring the idea. A project manager, two developers, and a QA engineer
          deliver it from disposable cloud sandboxes.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-cta px-8 py-4 text-sm font-semibold text-white hover:bg-ctahover"
        >
          Start a team
          <ArrowRight size={16} />
        </button>
      </div>
    </header>
  );
}
