import type { Metadata } from 'next';
import { Bricolage_Grotesque, Sora } from 'next/font/google';
import ConfigureAmplify from '@/components/ConfigureAmplify';
import './globals.css';

const brico = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-brico',
});

const display = Sora({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Wayfind SWARM — Hire an AI team',
  description:
    'Hire an AI team. Get things done. Prebuilt teams with roles, collaboration workflows, and a shared workspace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${brico.variable} ${display.variable} bg-mist text-navy antialiased`}>
        <ConfigureAmplify>{children}</ConfigureAmplify>
      </body>
    </html>
  );
}
