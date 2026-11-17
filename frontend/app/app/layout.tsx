import type { Metadata } from 'next';
import AuthGate from '@/components/app/AuthGate';

export const metadata: Metadata = {
  title: 'Wayfind SWARM — Your Bots',
  description: 'Message your bots. They work on your computer.',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
