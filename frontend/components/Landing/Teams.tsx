'use client';

import { useState } from 'react';

interface TeamsProps {
  onSignIn: () => void;
}

interface TeamCard {
  initials: string;
  tile: string;
  category: string;
  name: string;
  tagline: string;
  roles: string;
  featured?: boolean;
}

const categories = ['All', 'Build', 'Grow', 'Run'] as const;

const cards: TeamCard[] = [
  {
    initials: 'SW',
    tile: 'bg-navy text-white',
    category: 'Build',
    name: 'Software Development',
    tagline: 'Applications, APIs, and websites.',
    roles: 'Project Manager · Frontend · Backend · QA Engineer — AI-authored browser tests on every release.',
    featured: true,
  },
  {
    initials: 'DS',
    tile: 'bg-bamber text-navy',
    category: 'Build',
    name: 'Design Studio',
    tagline: 'Brand, UI, and clickable prototypes.',
    roles: 'Brand Designer · UI Designer · Prototyper.',
  },
  {
    initials: 'GR',
    tile: 'bg-blagoon text-white',
    category: 'Grow',
    name: 'Growth & Marketing',
    tagline: 'Campaigns, content, and distribution.',
    roles: 'Strategist · Content Creator · SEO · Social.',
  },
  {
    initials: 'BD',
    tile: 'bg-bgrape text-white',
    category: 'Grow',
    name: 'Business Development',
    tagline: 'Research markets, find leads, run outreach.',
    roles: 'Researcher · Lead-gen · Sales.',
  },
  {
    initials: 'OP',
    tile: 'bg-bcoral text-white',
    category: 'Run',
    name: 'Operations',
    tagline: 'Reporting and routine business work.',
    roles: 'Ops Manager · Finance Assistant · Analyst.',
  },
  {
    initials: 'DA',
    tile: 'bg-bmoss text-white',
    category: 'Run',
    name: 'Data & Analytics',
    tagline: 'Dashboards, insights, and forecasts.',
    roles: 'Data Analyst · Reporting · Forecasting.',
  },
];

export default function Teams({ onSignIn }: TeamsProps) {
  const [active, setActive] = useState<(typeof categories)[number]>('All');
  const visible = active === 'All' ? cards : cards.filter((c) => c.category === active);

  return (
    <section id="teams" className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="max-w-2xl font-brico text-4xl font-bold md:text-5xl">
            Explore teams
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-ink">
            Prebuilt teams with defined roles and a shared workspace. Pick one and start with a sentence.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1 rounded-full bg-mist p-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                active === cat ? 'bg-navy text-white shadow-sm' : 'text-ink hover:text-navy'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div key={active} className="fade-up mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((c) => (
          <div
            key={c.name}
            className={`flex flex-col rounded-2xl p-7 ${
              c.featured ? 'border-2 border-navy' : 'border border-gray-200'
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl font-brico text-sm font-bold ${c.tile}`}
            >
              {c.initials}
            </span>
            <p className="mt-5 font-brico text-xl font-bold">{c.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{c.tagline}</p>
            <p className="mt-3 text-xs leading-relaxed text-ink/70">{c.roles}</p>
            <button
              type="button"
              onClick={onSignIn}
              className={`mt-6 rounded-xl py-2.5 text-sm font-semibold ${
                c.featured ? 'bg-cta text-white hover:bg-ctahover' : 'bg-mist text-navy hover:bg-[#DDE9F7]'
              }`}
            >
              Hire this team
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
