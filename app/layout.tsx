import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxel Creator Pack — 30 Commercial-Use Assets for $9.99',
  description: 'Download 30 colorful voxel SVG assets for social graphics, websites, game mockups, streams, stickers, and client work. Commercial use included.',
  openGraph: {
    title: '30 Voxel Assets. $9.99. Commercial Use Included.',
    description: 'A ready-to-use creator pack with 30 scalable SVG voxel assets and a commercial-use license.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxel Creator Pack — 30 Assets for $9.99',
    description: '30 scalable voxel SVG assets with commercial use included.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
