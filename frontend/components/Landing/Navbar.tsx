'use client';

import Mascot from '../Mascot';

interface NavbarProps {
  onSignIn: () => void;
}

export default function Navbar({ onSignIn }: NavbarProps) {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-2.5">
        <Mascot color="black" size="sm" motion="none" label="Wayfind mascot" />
        <span className="font-brico text-lg font-bold">Wayfind SWARM</span>
      </div>
      <div className="flex items-center gap-7 text-sm text-ink">
        <a href="#teams" className="hidden hover:text-navy md:inline">Teams</a>
        <a href="#how" className="hidden hover:text-navy md:inline">How it works</a>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-xl bg-navy px-4 py-2 font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    </nav>
  );
}
