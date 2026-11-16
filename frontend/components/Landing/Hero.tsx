'use client';

import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onSignIn: () => void;
}

export default function Hero({ onSignIn }: HeroProps) {
  return (
    <header className="mx-auto max-w-6xl px-6 pb-24 pt-6 md:pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/70">
        A swarm of AI agents, ready for hire
      </p>
      <h1 className="mt-6 max-w-4xl font-brico text-6xl font-bold leading-[0.98] md:text-8xl">
        An entire team, hired in a sentence.
      </h1>
      <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <p className="max-w-md text-lg leading-relaxed text-ink">
          You bring the idea. A project manager, two developers, and a QA engineer
          deliver it in one shared workspace.
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
