import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxel Vault — Turn Any Photo Into a 3D Voxel for $9.99',
  description: 'Upload one photo and generate a downloadable custom voxel model.',
  openGraph: {
    title: 'Voxel Vault — One Photo. One Voxel. $9.99.',
    description: 'Turn any photo into a downloadable custom voxel model.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxel Vault — One Photo. One Voxel. $9.99.',
    description: 'Turn any photo into a downloadable custom voxel model.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
