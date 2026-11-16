'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';

export default function AppPage() {
  const { user, signOut } = useAuthenticator((c) => [c.user, c.signOut]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6 font-brico">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs uppercase tracking-widest text-ink">Wayfind SWARM</p>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-ice px-3 py-1.5 text-sm font-medium text-ink transition hover:border-cta hover:text-cta"
          >
            Log out
          </button>
        </div>
        <h1 className="mt-2 font-brico text-2xl font-bold text-navy">
          Welcome, {user?.signInDetails?.loginId ?? 'teammate'}
        </h1>
        <p className="mt-2 text-sm text-ink">
          Auth works against the shared user pool. Team hiring dashboard comes next.
        </p>
      </div>
    </main>
  );
}
