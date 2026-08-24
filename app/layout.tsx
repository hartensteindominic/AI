import './globals.css';

export const metadata = {
  title: 'GhostForge — Revenue Cockpit',
  description: 'Find, rank, build and track high-value development opportunities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
