import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Licensing — Machine License Units',
  description:
    'One x402 payment. One machine-use license. Bot uses asset → bot pays again.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'AI Licensing',
    description: 'Machine-use license units via x402. Exact one-use per payment.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Licensing — Machine License',
    description: 'Each successful x402 payment buys exactly one machine-use license unit.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
