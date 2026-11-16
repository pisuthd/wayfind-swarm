'use client';

import Link from 'next/link';
import { Authenticator, ThemeProvider, Theme, useAuthenticator } from '@aws-amplify/ui-react';

const theme: Theme = {
  name: 'Wayfind SWARM',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: '#DDE9F7' },
          80: { value: '#2F7BFF' },
          90: { value: '#1F63DA' },
          100: { value: '#0E1B2C' },
        },
      },
    },
    components: {
      button: {
        primary: { backgroundColor: { value: '#2F7BFF' }, _hover: { backgroundColor: { value: '#1F63DA' } } },
        link: { color: { value: '#2F7BFF' } },
      },
    },
  },
};

export default function AppPage() {
  return (
    <Authenticator.Provider>
      <AppInner />
    </Authenticator.Provider>
  );
}

function AppInner() {
  const { user, authStatus, signOut } = useAuthenticator((c) => [c.user, c.authStatus, c.signOut]);

  if (authStatus === 'configuring') {
    return <main className="min-h-screen bg-mist" />;
  }

  if (authStatus !== 'authenticated' || !user) {
    return (
      <ThemeProvider theme={theme}>
        <main className="flex min-h-screen items-center justify-center bg-mist px-6 py-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-6 inline-block text-sm font-medium text-ink hover:text-navy">
              ← Back
            </Link>
            <Authenticator socialProviders={['google']} loginMechanisms={['email']} />
            <p className="mt-4 text-center text-xs text-ink">Secured by AWS Cognito</p>
          </div>
        </main>
      </ThemeProvider>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6">
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
        <h1 className="mt-2 font-display text-2xl font-bold text-navy">
          Welcome, {user?.signInDetails?.loginId ?? 'teammate'}
        </h1>
        <p className="mt-2 text-sm text-ink">
          Auth works against the shared user pool. Team hiring dashboard comes next.
        </p>
      </div>
    </main>
  );
}
