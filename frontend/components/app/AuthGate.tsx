'use client';

import Link from 'next/link';
import {
  Authenticator,
  Theme,
  ThemeProvider,
  useAuthenticator,
  useTheme,
  View,
  Text,
} from '@aws-amplify/ui-react';
import Mascot from '@/components/Mascot';

const NAVY = '#0E1B2C';
const CTA = '#2F7BFF';
const CTA_HOVER = '#1F63DA';

const theme: Theme = {
  name: 'Wayfind SWARM Auth Theme',
  tokens: {
    fonts: {
      default: {
        variable: { value: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif" },
        static: { value: "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif" },
      },
    },
    colors: {
      brand: {
        primary: {
          10: { value: '#DDE9F7' },
          80: { value: CTA },
          90: { value: CTA_HOVER },
          100: { value: NAVY },
        },
      },
    },
    components: {
      authenticator: {
        router: {
          boxShadow: { value: '0 10px 40px rgba(14, 27, 44, 0.12)' },
          borderWidth: { value: '0' },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: CTA },
          _hover: { backgroundColor: { value: CTA_HOVER } },
        },
        link: { color: { value: CTA } },
      },
      tabs: {
        item: {
          color: { value: '#38506B' },
          _active: { borderColor: { value: CTA }, color: { value: NAVY } },
        },
      },
    },
  },
};

function BrandCard() {
  return (
    <section className="band relative hidden flex-col justify-between gap-5 overflow-hidden rounded-3xl p-10 text-white lg:flex lg:w-[45%]">
      <Link href="/" aria-label="Back to Wayfind home" className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
          <Mascot color="white" size="xs" motion="none" label="Wayfind mascot" />
        </span>
        <span className="font-brico text-lg font-bold">Wayfind</span>
      </Link>
      <div>
        <h2 className="max-w-md font-brico text-4xl font-bold leading-[1.05]">
          Start with free credits.
        </h2>
        <p className="mt-4 max-w-md leading-relaxed text-white/70">
          Try a full team before you spend anything. Free credits cover your first project end to end.
        </p>
      </div>
    </section>
  );
}

function AuthFooter() {
  const { tokens } = useTheme();
  return (
    <View textAlign="center" padding={tokens.space.large}>
      <Text
        color={tokens.colors.neutral[80]}
        fontSize="12px"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        Secured by AWS Cognito
      </Text>
    </View>
  );
}

function GateInner({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuthenticator((c) => [c.authStatus]);
  if (authStatus === 'authenticated') return <>{children}</>;
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-center">
        <BrandCard />
        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <Authenticator
              socialProviders={['google']}
              loginMechanisms={['email']}
            components={{
              Footer: AuthFooter,
            }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <Authenticator.Provider>
        <GateInner>{children}</GateInner>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}
