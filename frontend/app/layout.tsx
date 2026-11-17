import type { Metadata } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono, Sora } from 'next/font/google';
import ConfigureAmplify from '@/components/ConfigureAmplify';
import Script from "next/script";
import './globals.css';

const brico = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-brico',
});

const display = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
});

const jbmono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-jbmono',
});

export const metadata: Metadata = {
  title: 'Wayfind SWARM | Hire an AI team in one click',
  description:
    'Give your business an AI team for software, marketing, operations, and more. Hired in one click, executing in disposable cloud sandboxes with a persistent shared workspace. Start free.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
    <head>
      <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-51VBWDT3P2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-51VBWDT3P2');
          `}
        </Script>
    </head>
      <body className={`${brico.variable} ${display.variable} ${jbmono.variable} bg-mist font-display text-navy antialiased`}>
        <ConfigureAmplify>{children}</ConfigureAmplify>
      </body>
    </html>
  );
}
