'use client';

import { useState } from 'react';
import Link from 'next/link';
import Mascot, { type MascotColor, type MascotShape } from '../Mascot';

const stackShapes: MascotShape[] = ['blob', 'circle', 'squircle', 'pebble'];

interface TeamCard {
  members: MascotColor[];
  category: string;
  name: string;
  tagline: string;
  roles: string;
  slug: string;
}

const categories = ['All', 'Build', 'Grow'] as const;

const cards: TeamCard[] = [
  {
    members: ['amber', 'lagoon', 'grape', 'coral'],
    category: 'Build',
    name: 'Software Development',
    tagline: 'Applications, APIs, and websites.',
    roles: 'Project Manager · Frontend · Backend · QA',
    slug: 'software-development',
  },
  {
    members: ['amber', 'grape', 'lagoon'],
    category: 'Build',
    name: 'Design Studio',
    tagline: 'Brand, UI, and clickable prototypes.',
    roles: 'Brand Designer · UI Designer · Prototyper.',
    slug: 'design-studio',
  },
  {
    members: ['grape', 'lagoon', 'amber'],
    category: 'Grow',
    name: 'Video Production',
    tagline: 'Ads to series, from script to final cut.',
    roles: 'Creative Director · Clip Producer · QA.',
    slug: 'video-production',
  },
];

export default function Teams() {
  const [active, setActive] = useState<(typeof categories)[number]>('All');
  const visible = active === 'All' ? cards : cards.filter((c) => c.category === active);

  return (
    <section id="teams" className="mx-auto max-w-6xl px-6 py-14 md:py-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="max-w-2xl font-brico text-4xl font-bold md:text-5xl">
            Explore teams
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-ink">
            Prebuilt teams with defined roles and a shared workspace. Pick one and start with a sentence.
          </p>
        </div>
        <div className="flex shrink-0 gap-1 overflow-x-auto rounded-full bg-mist p-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
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
          <Link
            key={c.name}
            href={`/app?hire=${c.slug}`}
            className="group flex flex-col rounded-2xl border border-gray-200 p-7 transition hover:-translate-y-1 hover:border-navy/40 hover:shadow-lg"
          >
            <div className="flex -space-x-1.5">
              {c.members.map((color, i) => (
                <span key={color} className="rounded-full ring-2 ring-white">
                  <Mascot color={color} size="xs" shape={stackShapes[i % stackShapes.length]} motion="none" />
                </span>
              ))}
            </div>
            <p className="mt-5 font-brico text-xl font-bold">
              {c.name} <span aria-hidden="true" className="ml-1 inline-block transition group-hover:translate-x-1">→</span>
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink">{c.tagline}</p>
            <p className="mt-3 text-xs leading-relaxed text-ink/70">{c.roles}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
