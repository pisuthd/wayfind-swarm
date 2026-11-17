'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { brandNameFor, siteMode, type SiteMode } from '@/lib/site';
import Mascot from '../Mascot';

interface NavbarProps {
  onSignIn?: () => void;
}

export default function Navbar({ onSignIn }: NavbarProps) {
  const router = useRouter();
  const signIn = onSignIn ?? (() => router.push('/app'));
  // Runtime site mode (hostname): unknown until mount, so the brand slot
  // holds invisible placeholder text (no wrong pixels, no layout shift)
  // and the Docs link only appears once main mode is confirmed.
  const [mode, setMode] = useState<SiteMode | null>(null);
  useEffect(() => {
    setMode(siteMode());
  }, []);
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link href="/" aria-label="Back to Wayfind home" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy">
          <Mascot color="white" size="xs" motion="none" label="Wayfind mascot" />
        </span>
        <span className="font-brico text-lg font-bold">
          {mode ? brandNameFor(mode) : <span aria-hidden="true" className="invisible">Wayfind SWARM</span>}
        </span>
      </Link>
      <div className="flex items-center gap-7 text-sm text-ink">
        <a href="/#teams" className="hidden hover:text-navy md:inline">Teams</a>
        <a href="/#how" className="hidden hover:text-navy md:inline">How it works</a>
        <a href="/#pricing" className="hidden hover:text-navy md:inline">Pricing</a>
        <a href="/connectors" className="hidden hover:text-navy md:inline">Connectors</a>
        {mode === 'main' && <a href="/docs" className="hidden hover:text-navy md:inline">Docs</a>}
        <button
          type="button"
          onClick={signIn}
          className="rounded-xl bg-navy px-4 py-2 font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    </nav>
  );
}
